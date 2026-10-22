class DataManager {
  constructor() {
    this.notes = [];
  }

  async loadData() {
    try {
      let data = [];
      
      if (window.electronAPI && window.electronAPI.loadData) {
        const result = await window.electronAPI.loadData();
        if (result.success) {
          data = result.data;
        } else {
          console.error('Ошибка загрузки через Electron API:', result.error);
          const response = await fetch('./data.json');
          data = await response.json();
        }
      } else {
        const response = await fetch('./data.json');
        data = await response.json();
      }
      
      this.notes = data.map(item => ({
        id: item.id,
        title: item.name,
        content: item.content,
        login: item.login || '',
        password: item.password || '',
        isFavorite: item.favorite || false,
        isArchived: item.isArchived || false,
        createdAt: item.createdAt || new Date().toISOString()
      }));
      
      return [...this.notes];
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      this.notes = [];
      return [];
    }
  }




  async saveData() {
    try {
      localStorage.setItem('notes', JSON.stringify(this.notes));
      
      if (window.electronAPI && window.electronAPI.saveData) {
        const dataToSave = this.notes.map(note => ({
          name: note.title,
          content: note.content,
          id: note.id,
          image: "No",
          imageUrl: note.imageUrl || "",
          tags: note.tags || [],
          favorite: note.isFavorite,
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

  addNote(note) {
    this.notes.push(note);
  }

  updateNote(updatedNote) {
    const index = this.notes.findIndex(note => note.id === updatedNote.id);
    if (index !== -1) {
      this.notes[index] = updatedNote;
    }
  }

  deleteNote(noteId) {
    this.notes = this.notes.filter(note => note.id !== noteId);
  }

  getNotes() {
    return [...this.notes];
  }





  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DataManager;
} else {
  window.DataManager = DataManager;
} 