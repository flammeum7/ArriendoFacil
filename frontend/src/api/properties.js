import client from './client';

export const propertiesApi = {
  list: (params) => client.get('/properties', { params }),
  get: (id) => client.get(`/properties/${id}`),
  create: (payload) => client.post('/properties', payload),
  update: (id, payload) => client.put(`/properties/${id}`, payload),
  changeStatus: (id, status) => client.patch(`/properties/${id}/status`, { status }),
};
