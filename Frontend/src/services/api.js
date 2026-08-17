import axios from 'axios';

const getApiBaseUrl = () => {
  let envUrl = import.meta.env.VITE_API_BASE_URL;
  if (!envUrl || typeof envUrl !== 'string') return '';
  envUrl = envUrl.trim();
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) return envUrl;
  // If bare host without dot (e.g. marketmind-security-gateway or srv-xxx), append .onrender.com
  if (!envUrl.includes('.') && !envUrl.includes('localhost')) {
    return `https://${envUrl}.onrender.com`;
  }
  return `https://${envUrl}`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    Accept: 'application/json',
  },
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

// Response interceptor: redirect to login on 401 if a token was present
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // Remove token and notify the app without forcing a hard reload, but only if the token exists.
      try {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        if (token) {
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          window.dispatchEvent(new Event('marketmind:auth-expired'));
        }
      } catch (e) {}
    }
    return Promise.reject(error);
  },
);

export default api;
