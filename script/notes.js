// Импортируем модули
// В браузере они должны быть загружены через script теги в HTML

class NotesApp {
  constructor() {
    // Инициализируем менеджеры
    this.dataManager = new DataManager();
    this.uiManager = new UIManager(this.dataManager);
    this.modalManager = new ModalManager(this.dataManager, this.uiManager);
    this.eventManager = new EventManager(this.dataManager, this.uiManager, this.modalManager);
    
    this.init();
  }

  async init() {
    try {
      console.log('🚀 NotesApp: Начинаем инициализацию...');
      
      console.log('🎨 NotesApp: Загружаем тему...');
      this.uiManager.loadTheme();
      
      console.log('📁 NotesApp: Загружаем категории...');
      await this.dataManager.loadCategories();
      
      console.log('📝 NotesApp: Загружаем заметки...');
      // ✅ Загружаем данные только ОДИН раз!
      const notes = await this.dataManager.loadData();
      this.uiManager.setFilteredNotes(notes);
      console.log(`📝 NotesApp: Загружено ${notes.length} заметок`);
      
      console.log('⚡ NotesApp: Настраиваем события...');
      this.eventManager.setupEventListeners();
      this.eventManager.setupContextMenuListeners();
      
      console.log('🎨 NotesApp: Рендерим интерфейс...');
      this.uiManager.renderCategories();
      this.uiManager.renderNotes();
      
      console.log('✅ NotesApp: Инициализация завершена успешно!');
    } catch (error) {
      console.error('❌ NotesApp: Ошибка при инициализации:', error);
      console.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }

  // Методы для работы с заметками
  async saveNote() {
    await this.modalManager.saveNote();
  }

  editNote() {
    const currentNote = this.uiManager.getCurrentNote();
    if (currentNote) {
      this.modalManager.showNoteModal(currentNote);
    }
  }

  async deleteNote() {
    const currentNote = this.uiManager.getCurrentNote();
    if (currentNote) {
      this.modalManager.showDeleteConfirmation();
    }
  }

  async toggleFavorite(noteId) {
    const note = this.dataManager.getNotes().find(n => n.id === noteId);
    if (note) {
      note.isFavorite = !note.isFavorite;
      this.uiManager.renderNotes();
      this.uiManager.renderNoteDetails();
      await this.dataManager.saveData();
      
      const action = note.isFavorite ? 'добавлена в избранное' : 'убрана из избранного';
      this.uiManager.showNotification(`Заметка "${note.title}" ${action}`);
    }
  }

  async toggleArchive() {
    const currentNote = this.uiManager.getCurrentNote();
    if (currentNote) {
      currentNote.isArchived = !currentNote.isArchived;
      this.uiManager.renderNotes();
      this.uiManager.renderNoteDetails();
      await this.dataManager.saveData();
      
      const action = currentNote.isArchived ? 'архивирована' : 'разархивирована';
      this.uiManager.showNotification(`Заметка "${currentNote.title}" ${action}`);
    }
  }

  // Методы для работы с категориями
  async saveCategory() {
    await this.modalManager.saveCategory();
  }

  async deleteCategory(category) {
    await this.modalManager.deleteCategory(category);
  }

  // Методы для работы с модальными окнами
  showNoteModal(note = null) {
    this.modalManager.showNoteModal(note);
  }

  hideNoteModal() {
    this.modalManager.hideNoteModal();
  }

  showCategoryModal() {
    this.modalManager.showCategoryModal();
  }

  hideCategoryModal() {
    this.modalManager.hideCategoryModal();
  }

  showMoveModal() {
    this.modalManager.showMoveModal();
  }

  hideMoveModal() {
    this.modalManager.hideMoveModal();
  }

  async moveToCategory() {
    await this.modalManager.moveToCategory();
  }

  // Методы для работы с видимостью
  toggleFieldVisibility(btn) {
    this.uiManager.toggleFieldVisibility(btn);
  }

  togglePasswordVisibility() {
    this.modalManager.togglePasswordVisibility();
  }

  // Методы для работы с буфером обмена
  async copyToClipboard(text) {
    await this.uiManager.copyToClipboard(text);
  }

  // Методы для экспорта/импорта
  async exportData() {
    await this.eventManager.exportData();
  }

  async importData() {
    await this.eventManager.importData();
  }

  // Методы для уведомлений
  showNotification(message, type = 'success') {
    this.uiManager.showNotification(message, type);
  }
}

// Создаем глобальный экземпляр приложения
let notesApp;

// Инициализируем приложение после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
  try {
    console.log('🌟 DOM загружен, создаем NotesApp...');
    notesApp = new NotesApp();
    // ✅ Делаем доступным глобально для event delegation
    window.notesApp = notesApp;
    console.log('🌟 NotesApp создан и доступен в window.notesApp');
  } catch (error) {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА при создании NotesApp:', error);
    console.error('💥 Stack trace:', error.stack);
    alert('Критическая ошибка при запуске приложения! Откройте DevTools (F12) и посмотрите консоль.');
  }
});

// Экспортируем для использования в других модулях
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotesApp;
} else {
  window.NotesApp = NotesApp;
} 