class NotesApp {
  constructor() {
    this.notes = [];
    this.categories = ['Все', 'Пароли', 'Команды', 'Заметки', 'Избранное', 'Архив'];
    this.currentCategory = 'Все';
    this.currentNote = null;
    this.isHidden = false;
    this.filteredNotes = [];
    this.isDarkMode = true; // Темный режим по умолчанию
    
    this.init();
  }

  async init() {
    this.loadTheme();
    await this.loadData();
    this.setupEventListeners();
    this.setupContextMenuListeners();
    this.renderCategories();
    this.renderNotes();
  }

  loadTheme() {
    // Загружаем сохраненную тему или используем темную по умолчанию
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
    const themeBtn = document.getElementById('theme-toggle');
    if (this.isDarkMode) {
      themeBtn.textContent = '☀️';
      themeBtn.title = 'Переключить на светлую тему';
    } else {
      themeBtn.textContent = '🌙';
      themeBtn.title = 'Переключить на темную тему';
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  async loadData() {
    try {
      let data = [];
      
      // Используем Electron API для загрузки данных
      if (window.electronAPI && window.electronAPI.loadData) {
        const result = await window.electronAPI.loadData();
        if (result.success) {
          data = result.data;
        } else {
          console.error('Ошибка загрузки через Electron API:', result.error);
          // Fallback к fetch если Electron API недоступен
          const response = await fetch('./data.json');
          data = await response.json();
        }
      } else {
        // Fallback к fetch если Electron API недоступен
        const response = await fetch('./data.json');
        data = await response.json();
      }
      
      // Преобразуем данные в новый формат
      this.notes = data.map(item => ({
        id: item.id,
        title: item.name,
        content: item.content,
        category: this.detectCategory(item.name, item.content),
        login: item.login || '',
        password: item.password || '',
        isFavorite: item.favorite || false,  // Читаем поле favorite из data.json
        isArchived: item.isArchived || false,
        createdAt: item.createdAt || new Date().toISOString()
      }));
      
      this.filteredNotes = [...this.notes];
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      this.notes = [];
      this.filteredNotes = [];
    }
  }

  detectCategory(title, content) {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerTitle.includes('git') || lowerContent.includes('git')) return 'Команды';
    if (lowerTitle.includes('sql') || lowerContent.includes('sql')) return 'Команды';
    if (lowerTitle.includes('пароль') || lowerTitle.includes('логин') || 
        lowerTitle.includes('password') || lowerTitle.includes('login')) return 'Пароли';
    
    return 'Заметки';
  }

  setupEventListeners() {
    // Переключение темы
    document.getElementById('theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Поиск
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchNotes(e.target.value);
    });

    // Кнопки в заголовке
    document.getElementById('add-note-btn').addEventListener('click', () => {
      this.showNoteModal();
    });

    document.getElementById('toggle-visibility-btn').addEventListener('click', () => {
      this.toggleVisibility();
    });

    // Категории
    document.getElementById('add-category-btn').addEventListener('click', () => {
      this.showCategoryModal();
    });

    // Модальные окна
    document.getElementById('close-modal').addEventListener('click', () => {
      this.hideNoteModal();
    });

    document.getElementById('close-category-modal').addEventListener('click', () => {
      this.hideCategoryModal();
    });

    document.getElementById('close-move-modal').addEventListener('click', () => {
      this.hideMoveModal();
    });

    document.getElementById('save-note').addEventListener('click', () => {
      this.saveNote();
    });

    document.getElementById('cancel-note').addEventListener('click', () => {
      this.hideNoteModal();
    });

    document.getElementById('save-category').addEventListener('click', () => {
      this.saveCategory();
    });

    document.getElementById('cancel-category').addEventListener('click', () => {
      this.hideCategoryModal();
    });

    document.getElementById('confirm-move').addEventListener('click', () => {
      this.moveToCategory();
    });

    document.getElementById('cancel-move').addEventListener('click', () => {
      this.hideMoveModal();
    });

    // Пароль в модальном окне
    document.getElementById('toggle-password').addEventListener('click', () => {
      this.togglePasswordVisibility();
    });

    // Закрытие модальных окон по клику вне их
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.hideNoteModal();
        this.hideCategoryModal();
        this.hideMoveModal();
      }
    });

    // Горячие клавиши
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + N - новая заметка
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.showNoteModal();
      }
      
      // Ctrl/Cmd + F - фокус на поиск
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search-input').focus();
      }

      // Ctrl/Cmd + T - переключить тему
      if ((e.ctrlKey || e.metaKey) && e.key === 't') {
        e.preventDefault();
        this.toggleTheme();
      }

      // Ctrl/Cmd + H - показать/скрыть пароли
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        this.toggleVisibility();
      }
      
      // Escape - закрыть модальные окна
      if (e.key === 'Escape') {
        this.hideNoteModal();
        this.hideCategoryModal();
        this.hideMoveModal();
      }
    });
  }

  setupContextMenuListeners() {
    // Слушаем действия из контекстного меню
    if (window.electronAPI && window.electronAPI.onTriggerAction) {
      window.electronAPI.onTriggerAction((action) => {
        switch (action) {
          case 'new-note':
            this.showNoteModal();
            break;
          case 'search':
            document.getElementById('search-input').focus();
            break;
          case 'toggle-theme':
            this.toggleTheme();
            break;
          case 'toggle-visibility':
            this.toggleVisibility();
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
      const result = await window.electronAPI.exportData(this.notes);
      if (result.success) {
        this.showNotification(`Данные экспортированы в ${result.path}`);
      } else if (!result.canceled) {
        this.showNotification('Ошибка экспорта данных', 'error');
      }
    } catch (error) {
      console.error('Ошибка экспорта:', error);
      this.showNotification('Ошибка экспорта данных', 'error');
    }
  }

  async importData() {
    try {
      const result = await window.electronAPI.importData();
      if (result.success) {
        // Преобразуем импортированные данные в нужный формат
        const importedNotes = result.data.map(item => ({
          id: item.id || this.generateId(),
          title: item.name || item.title || 'Импортированная заметка',
          content: item.content || '',
          category: this.detectCategory(item.name || item.title || '', item.content || ''),
          login: item.login || '',
          password: item.password || '',
          isFavorite: item.isFavorite || false,
          isArchived: item.isArchived || false,
          createdAt: item.createdAt || new Date().toISOString()
        }));

        // Добавляем новые заметки к существующим
        this.notes = [...this.notes, ...importedNotes];
        this.filterNotes();
        this.saveData();
        this.showNotification(`Импортировано ${importedNotes.length} заметок`);
      } else if (!result.canceled) {
        this.showNotification('Ошибка импорта данных', 'error');
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      this.showNotification('Ошибка импорта данных', 'error');
    }
  }

  renderCategories() {
    const container = document.getElementById('categories-list');
    container.innerHTML = '';

    this.categories.forEach(category => {
      const categoryEl = document.createElement('div');
      categoryEl.className = `category-item ${category === this.currentCategory ? 'active' : ''}`;
      categoryEl.innerHTML = `
        <span>${this.getCategoryIcon(category)} ${category}</span>
        ${category !== 'Все' && category !== 'Избранное' && category !== 'Архив' ? 
          `<button class="delete-category" onclick="notesApp.deleteCategory('${category}')">×</button>` : ''}
      `;
      categoryEl.addEventListener('click', () => {
        this.selectCategory(category);
      });
      container.appendChild(categoryEl);
    });
  }

  getCategoryIcon(category) {
    const icons = {
      'Все': '📋',
      'Пароли': '🔐',
      'Команды': '💻',
      'Заметки': '📝',
      'Избранное': '⭐',
      'Архив': '📦'
    };
    return icons[category] || '📄';
  }

  selectCategory(category) {
    this.currentCategory = category;
    this.renderCategories();
    this.filterNotes();
  }

  filterNotes() {
    if (this.currentCategory === 'Все') {
      this.filteredNotes = this.notes.filter(note => !note.isArchived);
    } else if (this.currentCategory === 'Избранное') {
      this.filteredNotes = this.notes.filter(note => note.isFavorite && !note.isArchived);
    } else if (this.currentCategory === 'Архив') {
      this.filteredNotes = this.notes.filter(note => note.isArchived);
    } else {
      this.filteredNotes = this.notes.filter(note => note.category === this.currentCategory && !note.isArchived);
    }
    this.renderNotes();
  }

  searchNotes(query) {
    if (!query.trim()) {
      this.filterNotes();
      return;
    }

    const searchTerm = query.toLowerCase();
    this.filteredNotes = this.notes.filter(note => {
      const searchText = `${note.title} ${note.content} ${note.login} ${note.password}`.toLowerCase();
      return searchText.includes(searchTerm);
    });
    this.renderNotes();
  }

  renderNotes() {
    const container = document.getElementById('notes-list');
    container.innerHTML = '';

    if (this.filteredNotes.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 2rem;">Заметки не найдены</div>';
      return;
    }

    this.filteredNotes.forEach(note => {
      const noteEl = document.createElement('div');
      noteEl.className = `note-item ${note.id === this.currentNote?.id ? 'selected' : ''}`;
      noteEl.innerHTML = `
        <button class="favorite-btn ${note.isFavorite ? 'favorite-active' : ''}" 
                onclick="event.stopPropagation(); notesApp.toggleFavorite('${note.id}')" 
                title="${note.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}">
          ${note.isFavorite ? '⭐' : '☆'}
        </button>
        <div class="note-title">${note.title}</div>
        <div class="note-preview">${this.truncateText(note.content, 50)}</div>
        <div class="note-meta">
          <span>${this.getCategoryIcon(note.category)} ${note.category}</span>
          <span>${this.formatDate(note.createdAt)}</span>
        </div>
      `;
      noteEl.addEventListener('click', () => {
        this.selectNote(note);
      });
      container.appendChild(noteEl);
    });
  }

  selectNote(note) {
    this.currentNote = note;
    this.renderNotes();
    this.renderNoteDetails();
  }

  renderNoteDetails() {
    const container = document.getElementById('note-details');
    
    if (!this.currentNote) {
      container.innerHTML = '<div class="note-details-placeholder"><p>Выберите заметку для просмотра</p></div>';
      return;
    }

    const isArchived = this.currentNote.isArchived;
    const archiveBtnText = isArchived ? '📤 Из архива' : '📦 В архив';
    const archiveBtnClass = isArchived ? 'btn-secondary' : 'btn-warning';

    container.innerHTML = `
      <div class="note-details-content">
        <button class="favorite-btn favorite-btn-details ${this.currentNote.isFavorite ? 'favorite-active' : ''}" 
                onclick="notesApp.toggleFavorite('${this.currentNote.id}')" 
                title="${this.currentNote.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}">
          ${this.currentNote.isFavorite ? '⭐' : '☆'}
        </button>
        <div class="note-details-header">
          <div class="note-details-title-section">
            <div class="note-details-title-row">
              <h2 class="note-details-title">${this.currentNote.title}</h2>
            </div>
            <div style="color: var(--text-secondary); font-size: 14px;">
              ${this.getCategoryIcon(this.currentNote.category)} ${this.currentNote.category}
              ${isArchived ? ' (в архиве)' : ''}
            </div>
          </div>
          <div class="note-details-actions">
            <button class="btn btn-secondary" onclick="notesApp.showMoveModal()">
              📁 Переместить
            </button>
            <button class="btn ${archiveBtnClass}" onclick="notesApp.toggleArchive()">
              ${archiveBtnText}
            </button>
            <button class="btn btn-primary" onclick="notesApp.editNote()">✏️ Редактировать</button>
          </div>
        </div>

        ${this.currentNote.login ? `
          <div class="note-field">
            <label class="note-field-label">Логин:</label>
            <div class="note-field-value">
              <span class="${this.isHidden ? 'hidden' : ''}">${this.currentNote.login}</span>
              <button class="copy-btn" onclick="notesApp.copyToClipboard('${this.currentNote.login}')">Копировать</button>
            </div>
          </div>
        ` : ''}

        ${this.currentNote.password ? `
          <div class="note-field">
            <label class="note-field-label">Пароль:</label>
            <div class="note-field-value">
              <span class="${this.isHidden ? 'hidden' : ''}">${this.currentNote.password}</span>
              <div>
                <button class="toggle-visibility-btn" onclick="notesApp.toggleFieldVisibility(this)">
                  ${this.isHidden ? '👁️' : '🙈'}
                </button>
                <button class="copy-btn" onclick="notesApp.copyToClipboard('${this.currentNote.password}')">Копировать</button>
              </div>
            </div>
          </div>
        ` : ''}

        <div class="note-field">
          <label class="note-field-label">Содержимое:</label>
          <div class="note-field-value" style="flex-direction: column; align-items: flex-start;">
            <div style="width: 100%; white-space: pre-wrap;">${this.currentNote.content}</div>
            <button class="copy-btn" onclick="notesApp.copyToClipboard('${this.currentNote.content}')">Копировать всё</button>
          </div>
        </div>

        <div class="note-bottom-actions">
          <button class="btn btn-danger delete-note-btn" 
                  ondblclick="notesApp.showDeleteConfirmation()" 
                  title="Двойной клик для удаления заметки">
            🗑️ Удалить заметку
          </button>
        </div>
      </div>
    `;
  }

  showMoveModal() {
    const modal = document.getElementById('move-category-modal');
    const select = document.getElementById('move-category-select');
    
    // Заполняем категории (исключаем текущую категорию и системные)
    select.innerHTML = '';
    this.categories.forEach(category => {
      if (category !== 'Все' && category !== 'Избранное' && category !== this.currentNote.category) {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        select.appendChild(option);
      }
    });

    modal.classList.add('show');
  }

  hideMoveModal() {
    document.getElementById('move-category-modal').classList.remove('show');
  }

  moveToCategory() {
    const newCategory = document.getElementById('move-category-select').value;
    if (this.currentNote && newCategory) {
      this.currentNote.category = newCategory;
      this.hideMoveModal();
      this.filterNotes();
      this.renderNoteDetails();
      this.saveData();
      this.showNotification(`Заметка перемещена в категорию "${newCategory}"`);
    }
  }

  toggleArchive() {
    if (this.currentNote) {
      this.currentNote.isArchived = !this.currentNote.isArchived;
      this.renderNoteDetails();
      this.filterNotes();
      this.saveData();
      
      const action = this.currentNote.isArchived ? 'архивирована' : 'извлечена из архива';
      this.showNotification(`Заметка ${action}`);
    }
  }

  showNoteModal(note = null) {
    const modal = document.getElementById('note-modal');
    const title = document.getElementById('modal-title');
    const titleInput = document.getElementById('note-title');
    const categorySelect = document.getElementById('note-category');
    const loginInput = document.getElementById('note-login');
    const passwordInput = document.getElementById('note-password');
    const contentInput = document.getElementById('note-content');

    if (note) {
      title.textContent = 'Редактировать заметку';
      titleInput.value = note.title;
      loginInput.value = note.login || '';
      passwordInput.value = note.password || '';
      contentInput.value = note.content;
      this.currentNote = note;
    } else {
      title.textContent = 'Новая заметка';
      titleInput.value = '';
      loginInput.value = '';
      passwordInput.value = '';
      contentInput.value = '';
      this.currentNote = null;
    }

    // Заполняем категории (исключаем системные)
    categorySelect.innerHTML = '';
    this.categories.forEach(category => {
      if (category !== 'Все' && category !== 'Избранное' && category !== 'Архив') {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        if (note && note.category === category) {
          option.selected = true;
        }
        categorySelect.appendChild(option);
      }
    });

    modal.classList.add('show');
  }

  hideNoteModal() {
    document.getElementById('note-modal').classList.remove('show');
  }

  saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const category = document.getElementById('note-category').value;
    const login = document.getElementById('note-login').value.trim();
    const password = document.getElementById('note-password').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title || !content) {
      alert('Пожалуйста, заполните название и содержимое заметки');
      return;
    }

    if (this.currentNote) {
      // Редактирование существующей заметки
      this.currentNote.title = title;
      this.currentNote.category = category;
      this.currentNote.login = login;
      this.currentNote.password = password;
      this.currentNote.content = content;
    } else {
      // Создание новой заметки
      const newNote = {
        id: this.generateId(),
        title,
        category,
        login,
        password,
        content,
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString()
      };
      this.notes.push(newNote);
      this.currentNote = newNote;
    }

    this.hideNoteModal();
    this.filterNotes();
    this.renderNoteDetails();
    this.saveData();
  }

  editNote() {
    if (this.currentNote) {
      this.showNoteModal(this.currentNote);
    }
  }

  deleteNote() {
    if (this.currentNote && confirm('Вы уверены, что хотите удалить эту заметку?')) {
      const index = this.notes.findIndex(note => note.id === this.currentNote.id);
      if (index !== -1) {
        this.notes.splice(index, 1);
        this.currentNote = null;
        this.filterNotes();
        this.renderNoteDetails();
        this.saveData();
      }
    }
  }

  toggleFavorite(noteId) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.isFavorite = !note.isFavorite;
      this.renderNotes();
      this.renderNoteDetails();
      this.saveData();
      
      const action = note.isFavorite ? 'добавлена в избранное' : 'убрана из избранного';
      this.showNotification(`Заметка "${note.title}" ${action}`);
    }
  }

  showCategoryModal() {
    document.getElementById('category-modal').classList.add('show');
    document.getElementById('category-name').value = '';
  }

  hideCategoryModal() {
    document.getElementById('category-modal').classList.remove('show');
  }

  saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    if (name && !this.categories.includes(name)) {
      this.categories.push(name);
      this.hideCategoryModal();
      this.renderCategories();
      this.saveData();
    }
  }

  deleteCategory(category) {
    if (confirm(`Удалить категорию "${category}"? Заметки будут перемещены в "Заметки"`)) {
      // Перемещаем заметки в категорию "Заметки"
      this.notes.forEach(note => {
        if (note.category === category) {
          note.category = 'Заметки';
        }
      });

      // Удаляем категорию
      const index = this.categories.indexOf(category);
      if (index !== -1) {
        this.categories.splice(index, 1);
      }

      this.renderCategories();
      this.filterNotes();
      this.saveData();
    }
  }

  toggleVisibility() {
    this.isHidden = !this.isHidden;
    const btn = document.getElementById('toggle-visibility-btn');
    btn.textContent = this.isHidden ? '👁️ Показать' : '🙈 Скрыть';
    this.renderNoteDetails();
  }

  toggleFieldVisibility(btn) {
    const fieldValue = btn.closest('.note-field-value');
    const span = fieldValue.querySelector('span');
    span.classList.toggle('hidden');
    btn.textContent = span.classList.contains('hidden') ? '👁️' : '🙈';
  }

  togglePasswordVisibility() {
    const input = document.getElementById('note-password');
    const btn = document.getElementById('toggle-password');
    
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '🙈';
    } else {
      input.type = 'password';
      btn.textContent = '👁️';
    }
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showNotification('Скопировано в буфер обмена');
    } catch (err) {
      console.error('Ошибка копирования:', err);
      // Fallback для старых браузеров
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

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  }

  async saveData() {
    try {
      // Сохраняем в localStorage для быстрого доступа
      localStorage.setItem('notes', JSON.stringify(this.notes));
      localStorage.setItem('categories', JSON.stringify(this.categories));
      
      // Сохраняем в файл data.json через Electron API
      if (window.electronAPI && window.electronAPI.saveData) {
        // Преобразуем данные обратно в формат data.json
        const dataToSave = this.notes.map(note => ({
          name: note.title,
          content: note.content,
          id: note.id,
          image: "No",
          imageUrl: note.imageUrl || "",
          tags: note.tags || [],
          favorite: note.isFavorite,  // Сохраняем поле favorite
          login: note.login || "",
          password: note.password || "",
          isArchived: note.isArchived || false,
          createdAt: note.createdAt
        }));
        
        const result = await window.electronAPI.saveData(dataToSave);
        if (!result.success) {
          console.error('Ошибка сохранения в файл:', result.error);
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    }
  }

  showDeleteConfirmation() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content delete-confirmation-modal">
        <div class="modal-header">
          <h3>⚠️ Подтверждение удаления</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div class="delete-warning">
            <p><strong>Вы собираетесь удалить заметку:</strong></p>
            <p class="note-title-to-delete">"${this.currentNote.title}"</p>
            <p>Это действие <strong>необратимо</strong> и удалит заметку навсегда.</p>
          </div>
          <div class="form-group">
            <label for="delete-confirmation-input">Для подтверждения введите слово <strong>"уверен"</strong>:</label>
            <input type="text" id="delete-confirmation-input" class="form-input" placeholder="уверен">
          </div>
        </div>
        <div class="modal-footer">
          <button id="confirm-delete-btn" class="btn btn-danger" disabled>🗑️ Удалить навсегда</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = document.getElementById('delete-confirmation-input');
    const confirmBtn = document.getElementById('confirm-delete-btn');

    // Обработка ввода для активации кнопки
    input.addEventListener('input', (e) => {
      const isCorrect = e.target.value.toLowerCase() === 'уверен';
      confirmBtn.disabled = !isCorrect;
      if (isCorrect) {
        confirmBtn.style.background = 'var(--danger)';
      } else {
        confirmBtn.style.background = 'var(--accent-secondary)';
      }
    });

    // Обработка Enter для подтверждения
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.toLowerCase() === 'уверен') {
        this.deleteNote();
        modal.remove();
      }
    });

    // Обработка клика по кнопке подтверждения
    confirmBtn.addEventListener('click', () => {
      if (input.value.toLowerCase() === 'уверен') {
        this.deleteNote();
        modal.remove();
      }
    });

    // Фокус на поле ввода
    input.focus();
  }
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Инициализация приложения
let notesApp;
document.addEventListener('DOMContentLoaded', () => {
  notesApp = new NotesApp();
}); 