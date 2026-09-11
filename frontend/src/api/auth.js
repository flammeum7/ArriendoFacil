import client from './client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }),
  refresh: () => client.post('/auth/refresh'),
  logout: () => client.post('/auth/logout'),
  me: () => client.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    client.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email) => client.post('/auth/forgot-password', { email }),
  resetPassword: (token, newPassword) =>
    client.post('/auth/reset-password', { token, newPassword }),
};
