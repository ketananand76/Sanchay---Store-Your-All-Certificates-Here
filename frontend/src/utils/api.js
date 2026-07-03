import axios from 'axios';

const api = axios.create({
  // In development, use VITE_API_URL or local port. In production, use relative paths to enable Vercel Proxying.
  baseURL: import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const socketUrl = import.meta.env.DEV 
  ? 'http://localhost:5000' 
  : 'https://sanchay-store-your-all-certificates-here.onrender.com';

export const getFileUrl = (url) => {
  if (!url) return '';
  return url.startsWith('/uploads')
    ? (import.meta.env.DEV ? (import.meta.env.VITE_API_URL || 'http://localhost:5000') : '') + url
    : url;
};

export default api;
