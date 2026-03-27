const API_BASE = 'http://localhost:3000'; // Change to 10.0.2.2 for Android

export const apiService = {
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return res.json();
  },

  async health() {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
  },

  async chat(username: string, message: string, history: any[]) {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, message, history })
    });
    return res.json();
  },

  async getChatHistory(username: string) {
    const res = await fetch(`${API_BASE}/api/chat/history/${username}`);
    return res.json();
  },

  async getTodayQueues() {
    const res = await fetch(`${API_BASE}/api/queues/today`);
    return res.json();
  },

  async clearChatHistory(username: string) {
    const res = await fetch(`${API_BASE}/api/chat/history/${username}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  async getCategories() {
    const res = await fetch(`${API_BASE}/api/categories`);
    return res.json();
  },

  async addCategory(name: string) {
    const res = await fetch(`${API_BASE}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    return res.json();
  },

  async toggleCategory(id: number, is_active: boolean) {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active })
    });
    return res.json();
  },

  async deleteCategory(id: number) {
    const res = await fetch(`${API_BASE}/api/categories/${id}`, { method: 'DELETE' });
    return res.json();
  }
};
