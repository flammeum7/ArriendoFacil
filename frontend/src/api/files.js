import client from './client';

// Descarga/visualiza un archivo protegido usando el token de sesión
export async function openProtectedFile(path) {
  const res = await client.get(path, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
