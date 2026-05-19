import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function startSession(url, count, delay) {
  const response = await api.post('/api/start', { url, count, delay });
  return response.data;
}

export default api;