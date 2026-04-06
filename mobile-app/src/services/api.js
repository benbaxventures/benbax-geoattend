import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_BASE_URL =
  Constants.expoConfig?.extra?.API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://geofence-app-jjpa.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
});

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/google-login',
  '/auth/register',
  '/auth/forgot-password',
];

api.interceptors.request.use(async (config) => {
  const url = config.url || '';
  const isPublicAuth = PUBLIC_AUTH_PATHS.some((p) => url.includes(p));
  if (!isPublicAuth) {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

let isRefreshing = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Surface useful network diagnostics in logs
    if (!error.response) {
      console.error('[API] Network error:', {
        baseURL: api.defaults.baseURL,
        url: originalRequest?.url,
        method: originalRequest?.method,
        code: error.code,
        message: error.message,
      });
    }

    // Render/Neon instances can "sleep" and wake slowly.
    // If we get a true network error (no response), try to wake via /health once and retry.
    if (
      !error.response &&
      originalRequest &&
      !originalRequest._wakeAndRetry &&
      originalRequest.url !== '/health' &&
      typeof originalRequest.url === 'string'
    ) {
      originalRequest._wakeAndRetry = true;
      try {
        await api.get('/health');
      } catch (wakeErr) {
        // ignore wake error; we'll retry the original request anyway
      }
      return api(originalRequest);
    }

    // If token expired and we haven't tried refreshing yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/refresh-token') &&
      !PUBLIC_AUTH_PATHS.some((p) => originalRequest.url?.includes(p))
    ) {
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
export const login = (identifier, password, institutionCode, memberType, deviceInfo) =>
  api.post('/auth/login', { staffId: identifier, password, institutionCode, memberType, ...deviceInfo });
export const googleLogin = (googleData) =>
  api.post('/auth/google-login', googleData);
export const forgotPassword = (identifier, email, newPassword, institutionCode, memberType) =>
  api.post('/auth/forgot-password', { staffId: identifier, email, newPassword, institutionCode, memberType });
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

// Geofence
export const postGeofenceEvent = (data) => api.post('/geofence/event', data);

// Leave Management
export const requestLeave = (data) => api.post('/leave', data);
export const getMyLeaves = () => api.get('/leave/my');
export const cancelLeave = (id) => api.put(`/leave/${id}/cancel`);

export default api;
