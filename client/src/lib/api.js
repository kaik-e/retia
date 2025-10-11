import axios from 'axios';

const API_BASE = '/api';

// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Templates
  templates: {
    getAll: () => axios.get(`${API_BASE}/templates`),
    getOne: (id) => axios.get(`${API_BASE}/templates/${id}`),
    upload: (formData) => axios.post(`${API_BASE}/templates`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),
    delete: (id) => axios.delete(`${API_BASE}/templates/${id}`),
    getContent: (id) => axios.get(`${API_BASE}/templates/${id}/content`),
  },

  // Domains
  domains: {
    getAll: () => axios.get(`${API_BASE}/domains`),
    getOne: (id) => axios.get(`${API_BASE}/domains/${id}`),
    create: (data) => axios.post(`${API_BASE}/domains`, data),
    update: (id, data) => axios.put(`${API_BASE}/domains/${id}`, data),
    delete: (id) => axios.delete(`${API_BASE}/domains/${id}`),
    generateNginx: (id) => axios.post(`${API_BASE}/domains/${id}/nginx`),
    deleteNginx: (id) => axios.delete(`${API_BASE}/domains/${id}/nginx`),
    autoConfigureNginx: (id) => axios.post(`${API_BASE}/domains/${id}/auto-configure-nginx`),
    getProxyStatus: (id) => axios.get(`${API_BASE}/domains/${id}/proxy-status`),
  },

  // Analytics
  analytics: {
    getLogs: (domainId, params) => axios.get(`${API_BASE}/analytics/${domainId}`, { params }),
    getSummary: (domainId, days) => axios.get(`${API_BASE}/analytics/${domainId}/summary`, { params: { days } }),
    clear: (domainId) => axios.delete(`${API_BASE}/analytics/${domainId}`),
  },
};
