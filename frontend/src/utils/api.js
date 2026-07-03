import axios from 'axios';

const api = axios.create({
  // In development, use VITE_API_URL or local port. In production, use relative paths to enable Vercel Proxying.
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const msg = error.response.data?.message || '';
      if (msg.includes('blocked') || msg.includes('moderation')) {
        window.location.href = '/login?error=' + encodeURIComponent(msg);
      }
    }
    return Promise.reject(error);
  }
);

export const socketUrl = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : 'https://sanchay-store-your-all-certificates-here.onrender.com';

export const getFileUrl = (url) => {
  if (!url) return '';
  const normalized = url.startsWith('/') ? url : '/' + url;
  const backendUrl = import.meta.env.DEV 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') 
    : 'https://sanchay-store-your-all-certificates-here.onrender.com';

  return normalized.startsWith('/uploads')
    ? backendUrl + normalized
    : url;
};

export default api;
