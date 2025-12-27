import axios from 'axios';

// API base URL - use environment variable or default to localhost
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed in future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle errors globally
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============================================
// COURSES API
// ============================================
export const coursesApi = {
  getAll: (status) =>
    apiClient.get('/courses', { params: status ? { status } : {} }),

  getById: (id) =>
    apiClient.get(`/courses/${id}`),

  create: (data) =>
    apiClient.post('/courses', data),

  update: (id, data) =>
    apiClient.put(`/courses/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/courses/${id}`),

  addSubtopic: (courseId, data) =>
    apiClient.post(`/courses/${courseId}/subtopics`, data),

  updateSubtopic: (courseId, subtopicId, data) =>
    apiClient.put(`/courses/${courseId}/subtopics/${subtopicId}`, data),

  deleteSubtopic: (courseId, subtopicId) =>
    apiClient.delete(`/courses/${courseId}/subtopics/${subtopicId}`),
};

// ============================================
// SUBJECTS API
// ============================================
export const subjectsApi = {
  getAll: (status) =>
    apiClient.get('/subjects', { params: status ? { status } : {} }),

  getById: (id) =>
    apiClient.get(`/subjects/${id}`),

  create: (data) =>
    apiClient.post('/subjects', data),

  update: (id, data) =>
    apiClient.put(`/subjects/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/subjects/${id}`),

  addSubtopic: (subjectId, data) =>
    apiClient.post(`/subjects/${subjectId}/subtopics`, data),

  updateSubtopic: (subjectId, subtopicId, data) =>
    apiClient.put(`/subjects/${subjectId}/subtopics/${subtopicId}`, data),

  deleteSubtopic: (subjectId, subtopicId) =>
    apiClient.delete(`/subjects/${subjectId}/subtopics/${subtopicId}`),
};

// ============================================
// PRACTICES API
// ============================================
export const practicesApi = {
  getAll: () =>
    apiClient.get('/practices'),

  getById: (id) =>
    apiClient.get(`/practices/${id}`),

  create: (data) =>
    apiClient.post('/practices', data),

  update: (id, data) =>
    apiClient.put(`/practices/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/practices/${id}`),

  updateStats: (id, data) =>
    apiClient.put(`/practices/${id}/stats`, data),
};

// ============================================
// PROJECTS API
// ============================================
export const projectsApi = {
  getAll: (status) =>
    apiClient.get('/projects', { params: status ? { status } : {} }),

  getById: (id) =>
    apiClient.get(`/projects/${id}`),

  create: (data) =>
    apiClient.post('/projects', data),

  update: (id, data) =>
    apiClient.put(`/projects/${id}`, data),

  partialUpdate: (id, updates) =>
    apiClient.patch(`/projects/${id}`, updates),

  delete: (id) =>
    apiClient.delete(`/projects/${id}`),

  syncGithub: (id) =>
    apiClient.post(`/projects/${id}/sync-github`),
};

// ============================================
// SESSIONS API
// ============================================
export const sessionsApi = {
  getAll: (params) =>
    apiClient.get('/sessions', { params }),

  getById: (id) =>
    apiClient.get(`/sessions/${id}`),

  getActive: () =>
    apiClient.get('/sessions/active'),

  create: (data) =>
    apiClient.post('/sessions', data),

  update: (id, data) =>
    apiClient.put(`/sessions/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/sessions/${id}`),

  getStats: () =>
    apiClient.get('/sessions/stats/summary'),
};

// ============================================
// BOARDS API
// ============================================
export const boardsApi = {
  getAll: () =>
    apiClient.get('/boards'),

  getById: (id) =>
    apiClient.get(`/boards/${id}`),

  create: (data) =>
    apiClient.post('/boards', data),

  update: (id, data) =>
    apiClient.put(`/boards/${id}`, data),

  delete: (id) =>
    apiClient.delete(`/boards/${id}`),

  reorder: (data) =>
    apiClient.put('/boards/reorder', data),
};

// ============================================
// SETTINGS API
// ============================================
export const settingsApi = {
  get: () =>
    apiClient.get('/settings'),

  update: (data) =>
    apiClient.put('/settings', data),
};

// ============================================
// ANALYTICS API
// ============================================
export const analyticsApi = {
  getTimeSummary: (period = 'day') =>
    apiClient.get('/analytics/time-summary', { params: { period } }),

  getDistribution: (days = 30) =>
    apiClient.get('/analytics/distribution', { params: { days } }),

  getStreaks: () =>
    apiClient.get('/analytics/streaks'),

  getProgress: () =>
    apiClient.get('/analytics/progress'),

  getDailyActivity: (days = 30) =>
    apiClient.get('/analytics/daily-activity', { params: { days } }),
};

// ============================================
// UI CUSTOMIZATION API
// ============================================
export const uiCustomizationApi = {
  get: () =>
    apiClient.get('/ui-customization'),

  create: (data) =>
    apiClient.post('/ui-customization', data),

  update: (data) =>
    apiClient.put('/ui-customization', data),

  updateBoard: (boardId, data) =>
    apiClient.put(`/ui-customization/board/${boardId}`, data),

  deleteBoard: (boardId) =>
    apiClient.delete(`/ui-customization/board/${boardId}`),
};

export default apiClient;
