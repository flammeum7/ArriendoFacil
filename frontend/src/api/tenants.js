import client from './client';

export const tenantsApi = {
  list: (params) => client.get('/tenants', { params }),
  get: (id) => client.get(`/tenants/${id}`),
  create: (payload) => client.post('/tenants', payload),
  update: (id, payload) => client.put(`/tenants/${id}`, payload),
  deactivate: (id) => client.patch(`/tenants/${id}/deactivate`),
};
