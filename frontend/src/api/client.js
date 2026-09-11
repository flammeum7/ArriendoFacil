import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // envía la cookie httpOnly del refresh token
});

let accessToken = null;
export function setAccessToken(token) { accessToken = token; }
export function getAccessToken() { return accessToken; }

client.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshing = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url.includes('/auth/refresh') &&
      !original.url.includes('/auth/login')
    ) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = client.post('/auth/refresh').finally(() => { refreshing = null; });
        }
        const { data } = await refreshing;
        const newToken = data?.data?.accessToken;
        if (newToken) {
          setAccessToken(newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return client(original);
        }
      } catch (e) {
        setAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
