import client from './client';

export const documentsApi = {
  list: (params) => client.get('/documents', { params }),
  upload: (formData) => client.post('/documents', formData),
  remove: (id) => client.delete(`/documents/${id}`),
};
