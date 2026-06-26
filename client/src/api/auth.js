import api from './axios';

export const loginAPI = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerAPI = (userData) =>
  api.post('/auth/register', userData);

export const forgotPasswordAPI = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPasswordAPI = (token, password) =>
  api.post('/auth/reset-password', { token, password });

export const getGoogleAuthURL = () =>
  `${api.defaults.baseURL}/auth/google`;

export const getMeAPI = () =>
  api.get('/auth/me');
