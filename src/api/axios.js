import axios from 'axios';

const getBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Check if the application is accessed locally or via local network IP, and target backend port 5000
    if (hostname === 'localhost' || hostname === '127.0.0.1' || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      return `http://${hostname}:5000/api`;
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('re_quality_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('re_quality_token');
      localStorage.removeItem('re_quality_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
