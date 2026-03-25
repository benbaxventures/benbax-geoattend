import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://geofence-app-jjpa.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If token expired and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/refresh-token')) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await api.post('/auth/refresh-token');
          await AsyncStorage.setItem('token', data.token);
          isRefreshing = false;

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          await AsyncStorage.multiRemove(['token', 'user', 'institution']);
          return Promise.reject(error);
        }
      }
    }

    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user', 'institution']);
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (staffId, password, deviceInfo) =>
  api.post('/auth/login', { staffId, password, ...deviceInfo });
export const googleLogin = (googleData) =>
  api.post('/auth/google-login', googleData);
export const forgotPassword = (staffId, email, newPassword) =>
  api.post('/auth/forgot-password', { staffId, email, newPassword });
export const refreshToken = () => api.post('/auth/refresh-token');
export const getProfile = () => api.get('/auth/profile');
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/change-password', { currentPassword, newPassword });

// Attendance
export const checkIn = (data) => api.post('/attendance/check-in', data);
export const checkOut = (data) => api.post('/attendance/check-out', data);
export const getTodayStatus = () => api.get('/attendance/today');
export const getMyAttendance = (params) => api.get('/attendance/my-attendance', { params });
export const getWeeklyStats = () => api.get('/attendance/weekly-stats');

// Leave Management
export const requestLeave = (data) => api.post('/leave', data);
export const getMyLeaves = () => api.get('/leave/my');
export const cancelLeave = (id) => api.put(`/leave/${id}/cancel`);

export default api;
