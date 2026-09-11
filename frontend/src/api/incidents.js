import client from './client';

export const incidentsApi = {
  list: (params) => client.get('/incidents', { params }),
  get: (id) => client.get(`/incidents/${id}`),
  create: (formData) => client.post('/incidents', formData),
  respond: (id, formData) => client.post(`/incidents/${id}/responses`, formData),
  changeStatus: (id, status) => client.patch(`/incidents/${id}/status`, { status }),
};
