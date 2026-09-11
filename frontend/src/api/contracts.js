import client from './client';

export const contractsApi = {
  list: (params) => client.get('/contracts', { params }),
  get: (id) => client.get(`/contracts/${id}`),
  create: (payload) => client.post('/contracts', payload),
  renew: (id, payload) => client.post(`/contracts/${id}/renew`, payload),
  cancel: (id) => client.patch(`/contracts/${id}/cancel`),
};
