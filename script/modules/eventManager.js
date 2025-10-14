class EventManager {
  constructor(dataManager, uiManager, modalManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.modalManager = modalManager;
  }

  setupEventListeners() {
    // Переключение темы (исправленный ID)
    document.getElementById('settings-btn').addEventListener('click', () => {
      this.uiManager.toggleTheme();
    });

    // Поиск
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.uiManager.searchNotes(e.target.value);
    });

    // Кнопки в заголовке
    document.getElementById('add-note-btn').addEventListener('click', () => {
      this.modalManager.showNoteModal();
    });

    // ✅ Кнопка DevTools
    document.getElementById('devtools-btn').addEventListener('click', async () => {
      if (window.electronAPI && window.electronAPI.openDevTools) {
        try {
          const result = await window.electronAPI.openDevTools();
          if (!result.success) {
            console.error('Failed to open DevTools:', result.error);
            // Fallback - пробуем открыть через F12
            document.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'F12',
              code: 'F12',
              keyCode: 123
            }));
          }
        } catch (error) {
          console.error('Error opening DevTools:', error);
        }
      } else {
        // Если electron API недоступен, показываем инструкцию
        alert('Нажмите F12 для открытия DevTools или откройте через контекстное меню');
      }
    });

    // ✅ EVENT DELEGATION для списка заметок (вместо множества addEventListener)
    document.getElementById('notes-list').addEventListener('click', (e) => {
      // Обработка кнопки избранного
      if (e.target.matches('[data-action="toggle-favorite"]')) {
        e.stopPropagation(); // Предотвращаем выбор заметки
        const noteId = e.target.dataset.noteId;
        if (window.notesApp) {
          window.notesApp.toggleFavorite(noteId);
        }
        return;
      }

      // Обработка клика по заметке (выбор заметки)
      const noteItem = e.target.closest('.note-item');
      if (noteItem && noteItem.dataset.noteId) {
        const noteId = noteItem.dataset.noteId;
        const note = this.dataManager.getNotes().find(n => n.id === noteId);
        if (note) {
          this.uiManager.selectNote(note);
        }
      }
    });

    // ✅ EVENT DELEGATION для деталей заметки (вместо inline onclick)
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

        case 'show-move-modal':
          if (window.notesApp) {
            window.notesApp.showMoveModal();
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
            // ✅ Декодируем HTML entities обратно в обычный текст
            const decodedText = this.decodeHtml(textToCopy);
            window.notesApp.copyToClipboard(decodedText);
          }
          break;

        case 'toggle-field-visibility':
          if (window.notesApp) {
            window.notesApp.toggleFieldVisibility(e.target);
          }
          break;

        case 'toggle-archive':
          if (window.notesApp) {
            window.notesApp.toggleArchive();
          }
          break;
      }
    });

    // Категории
    document.getElementById('add-category-btn').addEventListener('click', () => {
      this.modalManager.showCategoryModal();
    });

    // Модальные окна
    document.getElementById('close-modal').addEventListener('click', () => {
      this.modalManager.hideNoteModal();
    });

    document.getElementById('close-category-modal').addEventListener('click', () => {
      this.modalManager.hideCategoryModal();
    });

    document.getElementById('close-move-modal').addEventListener('click', () => {
      this.modalManager.hideMoveModal();
    });

    document.getElementById('save-note').addEventListener('click', async () => {
      await this.modalManager.saveNote();
    });

    document.getElementById('cancel-note').addEventListener('click', () => {
      this.modalManager.hideNoteModal();
    });

    document.getElementById('save-category').addEventListener('click', async () => {
      await this.modalManager.saveCategory();
    });

    document.getElementById('cancel-category').addEventListener('click', () => {
      this.modalManager.hideCategoryModal();
    });

    document.getElementById('confirm-move').addEventListener('click', async () => {
      await this.modalManager.moveToCategory();
    });

    document.getElementById('cancel-move').addEventListener('click', () => {
      this.modalManager.hideMoveModal();
    });

    // Пароль в модальном окне
    document.getElementById('toggle-password').addEventListener('click', () => {
      this.modalManager.togglePasswordVisibility();
    });

    // Закрытие модальных окон по клику вне их
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.modalManager.hideNoteModal();
        this.modalManager.hideCategoryModal();
        this.modalManager.hideMoveModal();
      }
    });

    // Горячие клавиши
    this.setupKeyboardShortcuts();
  }

  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N - новая заметка
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.modalManager.showNoteModal();
      }
      
      // Ctrl/Cmd + F - фокус на поиск
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }
      
      // Ctrl/Cmd + T - переключить тему
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.uiManager.toggleTheme();
      }
      
      // Escape - закрыть модальные окна
      if (e.key === 'Escape') {
        this.modalManager.hideNoteModal();
        this.modalManager.hideCategoryModal();
        this.modalManager.hideMoveModal();
      }
    });
  }

  setupContextMenuListeners() {
    // Слушаем действия из контекстного меню
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
      const categories = this.dataManager.getCategories();
      const exportData = {
        notes,
        categories,
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
        // Fallback для браузера
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

  async importData() {
    try {
      if (window.electronAPI && window.electronAPI.importData) {
        const result = await window.electronAPI.importData();
        if (result.success) {
          const data = result.data;
          
          if (data.notes && Array.isArray(data.notes)) {
            // Импортируем заметки
            data.notes.forEach(note => {
              if (!this.dataManager.getNotes().find(n => n.id === note.id)) {
                this.dataManager.addNote(note);
              }
            });
          }
          
          if (data.categories && Array.isArray(data.categories)) {
            // Импортируем категории
            data.categories.forEach(category => {
              this.dataManager.addCategory(category);
            });
          }
          
          await this.dataManager.saveData();
          await this.dataManager.saveCategories();
          
          this.uiManager.filterNotes();
          this.uiManager.renderNotes();
          this.uiManager.renderCategories();
          this.uiManager.showNotification('Данные импортированы');
        } else if (!result.canceled) {
          this.uiManager.showNotification('Ошибка импорта данных', 'error');
        }
      } else {
        // Fallback для браузера
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
          const file = e.target.files[0];
          if (file) {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (data.notes && Array.isArray(data.notes)) {
              data.notes.forEach(note => {
                if (!this.dataManager.getNotes().find(n => n.id === note.id)) {
                  this.dataManager.addNote(note);
                }
              });
            }
            
            if (data.categories && Array.isArray(data.categories)) {
              data.categories.forEach(category => {
                this.dataManager.addCategory(category);
              });
            }
            
            await this.dataManager.saveData();
            await this.dataManager.saveCategories();
            
            this.uiManager.filterNotes();
            this.uiManager.renderNotes();
            this.uiManager.renderCategories();
            this.uiManager.showNotification('Данные импортированы');
          }
        };
        input.click();
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      this.uiManager.showNotification('Ошибка импорта данных', 'error');
    }
  }

  // ✅ Метод для декодирования HTML entities обратно в обычный текст
  decodeHtml(html) {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  }
}

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EventManager;
} else {
  window.EventManager = EventManager;
} 