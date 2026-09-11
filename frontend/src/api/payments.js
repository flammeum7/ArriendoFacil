import client from './client';

export const paymentsApi = {
  list: (params) => client.get('/payments', { params }),
  get: (id) => client.get(`/payments/${id}`),
  uploadReceipt: (id, formData) => client.post(`/payments/${id}/receipt`, formData),
  approve: (id) => client.post(`/payments/${id}/approve`),
  reject: (id, reason) => client.post(`/payments/${id}/reject`, { reason }),
  generate: () => client.post('/jobs/generate-payments'),
  markOverdue: () => client.post('/jobs/mark-overdue'),
};
