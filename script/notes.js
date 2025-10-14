class NotesApp {
  constructor() {
    this.dataManager = new DataManager();
    this.uiManager = new UIManager(this.dataManager);
    this.modalManager = new ModalManager(this.dataManager, this.uiManager);
    this.eventManager = new EventManager(this.dataManager, this.uiManager, this.modalManager);
    
    this.init();
  }

  async init() {
    this.uiManager.loadTheme();
    await this.dataManager.loadCategories();
    
    const notes = await this.dataManager.loadData();
    this.uiManager.setFilteredNotes(notes);
    
    this.eventManager.setupEventListeners();
    this.eventManager.setupContextMenuListeners();
    
    this.uiManager.renderCategories();
    this.uiManager.renderNotes();
  }

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

  async saveCategory() {
    await this.modalManager.saveCategory();
  }

  async deleteCategory(category) {
    await this.modalManager.deleteCategory(category);
  }

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

  toggleFieldVisibility(btn) {
    this.uiManager.toggleFieldVisibility(btn);
  }

  togglePasswordVisibility() {
    this.modalManager.togglePasswordVisibility();
  }

  async copyToClipboard(text) {
    await this.uiManager.copyToClipboard(text);
  }

  async exportData() {
    await this.eventManager.exportData();
  }

  async importData() {
    await this.eventManager.importData();
  }

  showNotification(message, type = 'success') {
    this.uiManager.showNotification(message, type);
  }
}

let notesApp;

document.addEventListener('DOMContentLoaded', async () => {
  notesApp = new NotesApp();
  window.notesApp = notesApp;
});

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NotesApp;
} else {
  window.NotesApp = NotesApp;
} 