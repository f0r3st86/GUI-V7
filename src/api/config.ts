// API Configuration
// This will eventually point to your backend API
// For now, we'll use mock data that matches your current context

export const API_CONFIG = {
  // Development: Use mock data (no backend required)
  // Production: Switch to real API URL
  baseURL: import.meta.env.VITE_API_URL || 'mock',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export const isMockMode = API_CONFIG.baseURL === 'mock';
