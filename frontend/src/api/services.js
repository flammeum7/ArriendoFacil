import client from './client';

export const servicesApi = {
  list: (params) => client.get('/services', { params }),
  create: (payload) => client.post('/services', payload),
  update: (id, payload) => client.put(`/services/${id}`, payload),
};
