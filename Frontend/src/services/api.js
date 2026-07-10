import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Remove token and notify the app without forcing a hard reload.
      try {
        localStorage.removeItem('authToken');
        window.dispatchEvent(new Event('marketmind:auth-expired'));
      } catch (e) {}
    }
    return Promise.reject(error);
  },
);

export default api;
