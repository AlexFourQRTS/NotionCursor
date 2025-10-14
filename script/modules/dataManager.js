class DataManager {
  constructor() {
    this.notes = [];
    this.categories = ['Все', 'Пароли', 'Команды', 'Заметки', 'Избранное', 'Архив'];
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
        category: item.category || this.detectCategory(item.name, item.content),
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

  detectCategory(title, content) {
    const lowerTitle = title.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    for (const category of this.categories) {
      if (category !== 'Все' && category !== 'Избранное' && category !== 'Архив') {
        if (lowerTitle.includes(category.toLowerCase()) || lowerContent.includes(category.toLowerCase())) {
          return category;
        }
      }
    }
    
    if (lowerTitle.includes('git') || lowerContent.includes('git')) return 'Команды';
    if (lowerTitle.includes('sql') || lowerContent.includes('sql')) return 'Команды';
    if (lowerTitle.includes('пароль') || lowerTitle.includes('логин') || 
        lowerTitle.includes('password') || lowerTitle.includes('login')) return 'Пароли';
    
    return 'Заметки';
  }

  async loadCategories() {
    try {
      if (window.electronAPI && window.electronAPI.loadCategories) {
        const result = await window.electronAPI.loadCategories();
        if (result.success) {
          this.categories = result.data;
        } else {
          console.error('Ошибка загрузки категорий через Electron API:', result.error);
          const savedCategories = localStorage.getItem('categories');
          if (savedCategories) {
            this.categories = JSON.parse(savedCategories);
          }
        }
      } else {
        const savedCategories = localStorage.getItem('categories');
        if (savedCategories) {
          this.categories = JSON.parse(savedCategories);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error);
    }
  }

  async saveCategories() {
    try {
      localStorage.setItem('categories', JSON.stringify(this.categories));
      
      if (window.electronAPI && window.electronAPI.saveCategories) {
        const result = await window.electronAPI.saveCategories(this.categories);
        if (!result.success) {
          console.error('Ошибка сохранения категорий в файл:', result.error);
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения категорий:', error);
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
          category: note.category,
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

  getCategories() {
    return [...this.categories];
  }

  addCategory(category) {
    if (!this.categories.includes(category)) {
      this.categories.push(category);
    }
  }

  deleteCategory(category) {
    const index = this.categories.indexOf(category);
    if (index !== -1) {
      this.categories.splice(index, 1);
    }
  }

  updateNoteCategory(noteId, newCategory) {
    const note = this.notes.find(n => n.id === noteId);
    if (note) {
      note.category = newCategory;
    }
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