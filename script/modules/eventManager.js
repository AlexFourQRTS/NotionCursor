class EventManager {
  constructor(dataManager, uiManager, modalManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.modalManager = modalManager;
  }

  setupEventListeners() {
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.uiManager.toggleTheme();
    });

    document.getElementById('search-input').addEventListener('input', (e) => {
      this.uiManager.searchNotes(e.target.value);
    });

    document.getElementById('add-note-btn').addEventListener('click', () => {
      this.modalManager.showNoteModal();
    });

    document.getElementById('export-btn').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('import-btn').addEventListener('click', () => {
      this.importData();
    });

    document.getElementById('notes-list').addEventListener('click', (e) => {
      if (e.target.matches('[data-action="toggle-favorite"]')) {
        e.stopPropagation();
        const noteId = e.target.dataset.noteId;
        if (window.notesApp) {
          window.notesApp.toggleFavorite(noteId);
        }
        return;
      }

      const noteItem = e.target.closest('.note-item');
      if (noteItem && noteItem.dataset.noteId) {
        const noteId = noteItem.dataset.noteId;
        const note = this.dataManager.getNotes().find(n => n.id === noteId);
        if (note) {
          this.uiManager.selectNote(note);
        }
      }
    });

    document.getElementById('note-details').addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;

      switch (action) {
        case 'toggle-favorite':
          const noteId = e.target.dataset.noteId;
          if (window.notesApp) {
            window.notesApp.toggleFavorite(noteId);
          }
          break;

        case 'edit-note':
          if (window.notesApp) {
            window.notesApp.editNote();
          }
          break;

        case 'delete-note':
          if (window.notesApp) {
            window.notesApp.deleteNote();
          }
          break;

        case 'copy-to-clipboard':
          const textToCopy = e.target.dataset.text;
          if (textToCopy && window.notesApp) {
            const decodedText = this.decodeHtml(textToCopy);
            window.notesApp.copyToClipboard(decodedText);
          }
          break;

        case 'toggle-field-visibility':
          if (window.notesApp) {
            window.notesApp.toggleFieldVisibility(e.target);
          }
          break;
      }
    });

    document.getElementById('close-modal').addEventListener('click', () => {
      this.modalManager.hideNoteModal();
    });

    document.getElementById('save-note').addEventListener('click', async () => {
      await this.modalManager.saveNote();
    });

    document.getElementById('cancel-note').addEventListener('click', () => {
      this.modalManager.hideNoteModal();
    });

    document.getElementById('toggle-password').addEventListener('click', () => {
      this.modalManager.togglePasswordVisibility();
    });

    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.modalManager.hideNoteModal();
      }
    });

    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.modalManager.showNoteModal();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
      
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.uiManager.toggleTheme();
      }
      
      if (e.key === 'Escape') {
        this.modalManager.hideNoteModal();
      }
    });
  }

  setupContextMenuListeners() {
    if (window.electronAPI && window.electronAPI.onTriggerAction) {
      window.electronAPI.onTriggerAction((action) => {
        switch (action) {
          case 'new-note':
            this.modalManager.showNoteModal();
            break;
          case 'search':
            document.getElementById('search-input').focus();
            break;
          case 'toggle-theme':
            this.uiManager.toggleTheme();
            break;
          case 'export-data':
            this.exportData();
            break;
          case 'import-data':
            this.importData();
            break;
        }
      });
    }
  }

  async exportData() {
    try {
      const notes = this.dataManager.getNotes();
      const exportData = {
        notes,
        exportDate: new Date().toISOString()
      };
      
      if (window.electronAPI && window.electronAPI.exportData) {
        const result = await window.electronAPI.exportData(exportData);
        if (result.success) {
          this.uiManager.showNotification(`Данные экспортированы в ${result.path}`);
        } else if (!result.canceled) {
          this.uiManager.showNotification('Ошибка экспорта данных', 'error');
        }
      } else {
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `notes-backup-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.uiManager.showNotification('Данные экспортированы');
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      this.uiManager.showNotification('Ошибка экспорта данных', 'error');
    }
  }

  normalizeImportedNotes(data) {
    const list = Array.isArray(data) ? data : (data && Array.isArray(data.notes) ? data.notes : []);
    return list
      .filter(item => item && (item.title || item.name))
      .map(item => ({
        id: item.id || this.dataManager.generateId(),
        title: item.title || item.name,
        content: item.content || '',
        login: item.login || '',
        password: item.password || '',
        isFavorite: item.isFavorite ?? item.favorite ?? false,
        isArchived: false,
        createdAt: item.createdAt || new Date().toISOString()
      }));
  }

  async applyImport(data) {
    const incoming = this.normalizeImportedNotes(data);
    const existingIds = new Set(this.dataManager.getNotes().map(n => n.id));
    let added = 0;

    incoming.forEach(note => {
      if (!existingIds.has(note.id)) {
        this.dataManager.addNote(note);
        existingIds.add(note.id);
        added++;
      }
    });

    await this.dataManager.saveData();
    this.uiManager.filterNotes();
    this.uiManager.renderNotes();
    this.uiManager.showNotification(`Импортировано заметок: ${added} из ${incoming.length}`);
  }

  async importData() {
    try {
      if (window.electronAPI && window.electronAPI.importData) {
        const result = await window.electronAPI.importData();
        if (result.success) {
          await this.applyImport(result.data);
        } else if (!result.canceled) {
          this.uiManager.showNotification('Ошибка импорта данных', 'error');
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            await this.applyImport(JSON.parse(await file.text()));
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      this.uiManager.showNotification('Ошибка импорта данных', 'error');
    }
  }

  decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventManager;
} else {
  window.EventManager = EventManager;
} 