import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
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

// Auth
export const login = (staffId, password) => api.post('/auth/login', { staffId, password });
export const googleLogin = (googleData) => api.post('/auth/google-login', googleData);
export const getProfile = () => api.get('/auth/profile');

// Staff
export const getStaff = (params) => api.get('/staff', { params });
export const getStaffById = (id) => api.get(`/staff/${id}`);
export const createStaff = (data) => api.post('/staff', data);
export const updateStaff = (id, data) => api.put(`/staff/${id}`, data);
export const resetStaffPassword = (id, newPassword) => api.put(`/staff/${id}/reset-password`, { newPassword });
export const getStaffQRCode = (id) => api.get(`/staff/${id}/qr-code`);
export const getDepartments = () => api.get('/staff/departments');
export const deleteStaff = (id) => api.delete(`/staff/${id}`);

// Institution
export const getInstitution = () => api.get('/institutions/current');
export const updateInstitution = (data) => api.put('/institutions/current', data);
export const getAttendanceRules = () => api.get('/institutions/rules');
export const updateAttendanceRules = (data) => api.put('/institutions/rules', data);

// Reports
export const getDashboardStats = () => api.get('/reports/dashboard');
export const getAttendanceReport = (params) => api.get('/reports/attendance', { params });
export const getRealTimeAttendance = () => api.get('/reports/realtime');
export const getWeeklySummary = () => api.get('/reports/weekly-summary');

// Export URLs (download directly)
export const getExcelExportUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `${API_BASE_URL}/reports/export/excel?${query}`;
};
export const getPdfExportUrl = (params) => {
  const query = new URLSearchParams(params).toString();
  return `${API_BASE_URL}/reports/export/pdf?${query}`;
};

export default api;
