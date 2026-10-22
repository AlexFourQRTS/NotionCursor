class ModalManager {
  constructor(dataManager, uiManager) {
    this.dataManager = dataManager;
    this.uiManager = uiManager;
    this.currentEditingNote = null;
  }

  showNoteModal(note = null) {
    this.currentEditingNote = note;
    const modal = document.getElementById('note-modal');
    const title = document.getElementById('modal-title');
    const titleInput = document.getElementById('note-title');
    const loginInput = document.getElementById('note-login');
    const passwordInput = document.getElementById('note-password');
    const contentTextarea = document.getElementById('note-content');
    
    if (note) {
      title.textContent = 'Редактировать заметку';
      titleInput.value = note.title;
      loginInput.value = note.login || '';
      passwordInput.value = note.password || '';
      contentTextarea.value = note.content;
    } else {
      title.textContent = 'Новая заметка';
      titleInput.value = '';
      loginInput.value = '';
      passwordInput.value = '';
      contentTextarea.value = '';
    }
    
    modal.classList.add('show');
    titleInput.focus();
  }

  hideNoteModal() {
    document.getElementById('note-modal').classList.remove('show');
    this.currentEditingNote = null;
  }

  async saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const login = document.getElementById('note-login').value.trim();
    const password = document.getElementById('note-password').value.trim();
    const content = document.getElementById('note-content').value.trim();
    
    if (!title || !content) {
      this.uiManager.showNotification('Заполните название и содержимое', 'error');
      return;
    }
    
    const noteData = {
      title,
      content,
      login,
      password,
      isFavorite: false,
      isArchived: false,
      createdAt: new Date().toISOString()
    };
    
    if (this.currentEditingNote) {
      Object.assign(this.currentEditingNote, noteData);
      this.dataManager.updateNote(this.currentEditingNote);
      this.uiManager.showNotification('Заметка обновлена');
    } else {
      noteData.id = this.dataManager.generateId();
      this.dataManager.addNote(noteData);
      this.uiManager.showNotification('Заметка создана');
    }
    
    await this.dataManager.saveData();
    this.hideNoteModal();
    this.uiManager.filterNotes();
    this.uiManager.renderNotes();
    this.uiManager.renderNoteDetails();
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

  showDeleteConfirmation() {
    const currentNote = this.uiManager.getCurrentNote();
    if (!currentNote) return;

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
      <div class="modal-content delete-confirmation-modal">
        <div class="modal-header">
          <h3>● Подтверждение удаления</h3>
          <button class="close-btn" onclick="this.closest('.modal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div>
          <p class="note-title-to-delete">"${currentNote.title}"</p>
          </div>
          <div class="form-group">
            <div>Для подтверждения введите : 1</div>
            <input type="text" id="delete-confirmation-input" class="form-input" placeholder="1">
          </div>
        </div>
        <div class="modal-footer">
          <button id="confirm-delete-btn" class="btn btn-danger" disabled>◆ Удалить</button>
          <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    const input = modal.querySelector('#delete-confirmation-input');
    const confirmBtn = modal.querySelector('#confirm-delete-btn');
    
    input.addEventListener('input', () => {
      confirmBtn.disabled = input.value !== '1';
    });
    
    confirmBtn.addEventListener('click', async () => {
      if (input.value === '1') {
        this.dataManager.deleteNote(currentNote.id);
        await this.dataManager.saveData();
        this.uiManager.setCurrentNote(null);
        this.uiManager.filterNotes();
        this.uiManager.renderNotes();
        this.uiManager.renderNoteDetails();
        this.uiManager.showNotification('Заметка удалена');
        modal.remove();
      }
    });
  }

  getCurrentEditingNote() {
    return this.currentEditingNote;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = ModalManager;
} else {
  window.ModalManager = ModalManager;
} 