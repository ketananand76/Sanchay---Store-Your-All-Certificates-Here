import axios from 'axios';

const api = axios.create({
  // In development, use VITE_API_URL or local port. In production, use relative paths to enable Vercel Proxying.
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
