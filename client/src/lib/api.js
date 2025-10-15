import axios from 'axios';

const API_BASE = '/api';

// Add token to all requests
axios.interceptors.request.use(
  (config) => {
    console.log('[API] Request:', config.method?.toUpperCase(), config.url)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error)
    return Promise.reject(error);
  }
);

// Handle 401 responses (unauthorized)
axios.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('[API] Response error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    })
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
    getProxyStatus: (id) => axios.get(`${API_BASE}/domains/${id}/proxy-status`),
  },

  // Analytics
  analytics: {
    getLogs: (domainId, params) => axios.get(`${API_BASE}/analytics/${domainId}`, { params }),
    getSummary: (domainId, days) => axios.get(`${API_BASE}/analytics/${domainId}/summary`, { params: { days } }),
    clear: (domainId) => axios.delete(`${API_BASE}/analytics/${domainId}`),
  },

  // Users
  users: {
    getAll: () => axios.get(`${API_BASE}/users`),
    getOne: (id) => axios.get(`${API_BASE}/users/${id}`),
    create: (data) => axios.post(`${API_BASE}/users`, data),
    update: (id, data) => axios.put(`${API_BASE}/users/${id}`, data),
    delete: (id) => axios.delete(`${API_BASE}/users/${id}`),
  },

  // Automations (Cloudflare & GoDaddy)
  automations: {
    // Credentials
    credentials: {
      list: (provider) => axios.get(`${API_BASE}/automations/credentials`, { params: { provider } }),
      add: (data) => axios.post(`${API_BASE}/automations/credentials`, data),
      update: (id, data) => axios.put(`${API_BASE}/automations/credentials/${id}`, data),
      delete: (id) => axios.delete(`${API_BASE}/automations/credentials/${id}`),
    },
    // Cloudflare
    cloudflare: {
      getSettings: () => axios.get(`${API_BASE}/automations/cloudflare/settings`),
      saveSettings: (data) => axios.post(`${API_BASE}/automations/cloudflare/settings`, data),
      deleteSettings: () => axios.delete(`${API_BASE}/automations/cloudflare/settings`),
      listZones: (credentialId) => axios.get(`${API_BASE}/automations/cloudflare/zones`, { params: { credentialId } }),
      import: (data) => axios.post(`${API_BASE}/automations/cloudflare/import`, data),
    },
    // GoDaddy
    godaddy: {
      getSettings: () => axios.get(`${API_BASE}/automations/godaddy/settings`),
      saveSettings: (data) => axios.post(`${API_BASE}/automations/godaddy/settings`, data),
      deleteSettings: () => axios.delete(`${API_BASE}/automations/godaddy/settings`),
      listDomains: (credentialId) => axios.get(`${API_BASE}/automations/godaddy/domains`, { params: { credentialId } }),
      getDomain: (domain) => axios.get(`${API_BASE}/automations/godaddy/domains/${domain}`),
      import: (data) => axios.post(`${API_BASE}/automations/godaddy/import`, data),
    },
  },
};
