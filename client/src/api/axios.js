import axios from 'axios';

let API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Bulletproof: automatically append /api if the user forgot it in Vercel
if (import.meta.env.VITE_API_URL && !API_URL.endsWith('/api')) {
  API_URL = `${API_URL}/api`;
}

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;