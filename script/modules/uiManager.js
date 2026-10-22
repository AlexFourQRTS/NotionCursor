class UIManager {
  constructor(dataManager) {
    this.dataManager = dataManager;
    this.currentNote = null;
    this.isHidden = false;
    this.filteredNotes = [];
    this.isDarkMode = true;
  }

  loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    }
    this.applyTheme();
  }

  applyTheme() {
    const html = document.documentElement;
    if (this.isDarkMode) {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    this.updateThemeButton();
  }

  updateThemeButton() {
    const themeBtn = document.getElementById('settings-btn');
    if (this.isDarkMode) {
      themeBtn.textContent = '☽';
      themeBtn.title = 'Переключить на светлую тему';
    } else {
      themeBtn.textContent = '☀';
      themeBtn.title = 'Переключить на темную тему';
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }







  filterNotes() {
    const notes = this.dataManager.getNotes();
    
    this.filteredNotes = notes;
  }

  searchNotes(query) {
    if (!query.trim()) {
      this.filterNotes();
    } else {
      const notes = this.dataManager.getNotes();
      this.filteredNotes = notes.filter(note => {
        const searchText = `${note.title} ${note.content} ${note.login}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      });
    }
    this.renderNotes();
  }

  renderNotes() {
    const container = document.getElementById('notes-list');
    container.innerHTML = '';
    
    if (this.filteredNotes.length === 0) {
      container.innerHTML = '<div class="no-notes">Нет заметок</div>';
      return;
    }
    
    this.filteredNotes.forEach(note => {
      const noteElement = document.createElement('div');
      noteElement.className = `note-item ${note.id === this.currentNote?.id ? 'selected' : ''}`;
      noteElement.dataset.noteId = note.id;
      noteElement.innerHTML = `
        <div class="note-header">
          <h3 class="note-title">${note.title}</h3>
          <button class="favorite-btn ${note.isFavorite ? 'favorite-active' : ''}" 
                  data-action="toggle-favorite" data-note-id="${note.id}">
            ${note.isFavorite ? '★' : '☆'}
          </button>
        </div>
        <p class="note-preview">${this.truncateText(note.content, 100)}</p>
        <div class="note-meta">
          <span>${this.formatDate(note.createdAt)}</span>
        </div>
      `;
      container.appendChild(noteElement);
    });
  }

  selectNote(note) {
    const previousSelected = document.querySelector('.note-item.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }
    
    const newSelected = document.querySelector(`[data-note-id="${note.id}"]`);
    if (newSelected) {
      newSelected.classList.add('selected');
    }
    
    this.currentNote = note;
    this.renderNoteDetails();
  }

  renderNoteDetails() {
    const container = document.getElementById('note-details');
    
    if (!this.currentNote) {
      container.innerHTML = `
        <div class="note-details-placeholder">
          <p>Выберите заметку для просмотра</p>
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="note-details-content" data-note-id="${this.currentNote.id}">
        <div class="note-details-header">
          <div class="note-details-title-section">
            <div class="note-details-title-row">
              <h2 class="note-details-title">${this.currentNote.title}</h2>
              <button class="favorite-btn-details ${this.currentNote.isFavorite ? 'favorite-active' : ''}" 
                      data-action="toggle-favorite" data-note-id="${this.currentNote.id}">
                ${this.currentNote.isFavorite ? '★' : '☆'}
              </button>
            </div>
            <div class="note-details-actions">
              <button class="btn btn-secondary" data-action="edit-note"> ✎  Редактировать</button>
              <button class="btn btn-danger" data-action="delete-note"> ● Удалить</button>
            </div>
          </div>
        </div>
        
        ${this.currentNote.login ? `
          <div class="note-field">
            <label class="note-field-label">Логин:</label>
            <div class="note-field-value">
              <span>${this.currentNote.login}</span>
              <button class="copy-btn" data-action="copy-to-clipboard" data-text="${this.escapeHtml(this.currentNote.login)}">📋</button>
            </div>
          </div>
        ` : ''}
        
        ${this.currentNote.password ? `
          <div class="note-field">
            <label class="note-field-label">Пароль:</label>
            <div class="note-field-value">
              <span class="hidden">${this.currentNote.password}</span>
              <button class="copy-btn" data-action="copy-to-clipboard" data-text="${this.escapeHtml(this.currentNote.password)}">📋</button>
              <button class="toggle-visibility-btn" data-action="toggle-field-visibility">👁️</button>
            </div>
          </div>
        ` : ''}
        
        <div class="note-field">
          <label class="note-field-label">Содержимое:</label>
          <div class="note-field-value">
            <span>${this.currentNote.content}</span>
            <button class="copy-btn" data-action="copy-to-clipboard" data-text="${this.escapeHtml(this.currentNote.content)}">📋</button>
          </div>
        </div>
      </div>
    `;
  }

  toggleFieldVisibility(btn) {
    const fieldValue = btn.closest('.note-field-value');
    const span = fieldValue.querySelector('span');
    const isHidden = span.classList.contains('hidden');
    
    if (isHidden) {
      span.classList.remove('hidden');
      btn.textContent = '🙈';
    } else {
      span.classList.add('hidden');
      btn.textContent = '👁️';
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Скопировано в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.showNotification('Скопировано в буфер обмена');
    }
  }

  showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    const bgColor = type === 'error' ? 'var(--danger)' : 'var(--success)';
    
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${bgColor};
      color: #000000;
      padding: 1rem 1.5rem;
      border-radius: 6px;
      z-index: 10000;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px var(--shadow);
      font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 2000);
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  }

  getCurrentNote() {
    return this.currentNote;
  }

  setCurrentNote(note) {
    this.currentNote = note;
  }

  getFilteredNotes() {
    return this.filteredNotes;
  }

  setFilteredNotes(notes) {
    this.filteredNotes = notes;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else {
  window.UIManager = UIManager;
} 