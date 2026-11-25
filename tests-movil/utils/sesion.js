import fs from 'node:fs';
import { test } from '@playwright/test';
import { TOKEN_SESION } from './entorno.js';
import { registrarHallazgo } from './responsive.js';

const activadas = new WeakSet();

/**
 * Reutiliza la sesión guardada por auth.setup.js.
 * Intercepta la llamada POST /api/auth/refresh que hace la app al cargar y la responde
 * usando el refresh token capturado en el login, porque el navegador no conserva la cookie.
 * Si el defecto de la cookie está presente, lo anota como hallazgo en el reporte.
 * @param {import('@playwright/test').Page} page
 * @param {'arrendador'|'arrendatario'} rol
 */
export async function activarSesionGuardada(page, rol) {
  if (activadas.has(page)) return;
  activadas.add(page);

  let datos = { token: null, cookieAceptada: true };
  try {
    datos = JSON.parse(fs.readFileSync(TOKEN_SESION[rol], 'utf8'));
  } catch {
    return; // sin archivo: la app pedirá login y se usará el respaldo
  }

  if (!datos.cookieAceptada) {
    registrarHallazgo(test.info(),
      'INC: la sesión no sobrevive a la recarga (F5). El navegador rechaza la cookie refreshToken ' +
      '(SameSite=Strict, frontend y API en sitios distintos de onrender.com) y /auth/refresh responde 401.');
  }
  if (!datos.token) return;

  // El navegador no permite modificar la cabecera Cookie de la petición, así que la prueba
  // hace la llamada por su cuenta (route.fetch) con el token y entrega la respuesta a la app.
  await page.route('**/api/auth/refresh', async (route) => {
    const headers = { ...route.request().headers(), cookie: `refreshToken=${datos.token}` };
    const respuesta = await route.fetch({ headers });
    await route.fulfill({ response: respuesta });
  });
}
