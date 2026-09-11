import client from './client';

export const dashboardApi = {
  landlord: () => client.get('/dashboard/landlord'),
  tenant: () => client.get('/dashboard/tenant'),
};
