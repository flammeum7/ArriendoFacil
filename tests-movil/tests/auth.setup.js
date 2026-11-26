import fs from 'node:fs';
import { test as setup } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { ESTADO_SESION, TOKEN_SESION, tieneCuenta } from '../utils/entorno.js';

/**
 * Paso previo (proyecto "setup"): inicia sesión UNA vez por rol y guarda:
 *  1. la sesión del navegador (storageState), y
 *  2. el refresh token que devuelve el login.
 * El navegador rechaza la cookie del refresh token (SameSite=Strict, frontend y API en
 * sitios distintos de onrender.com), así que los casos usan el token guardado (2) para
 * no repetir el login y no alcanzar el límite de 20 intentos cada 15 minutos.
 */
fs.mkdirSync('.auth', { recursive: true });

for (const rol of ['arrendador', 'arrendatario']) {
  setup(`Guardar sesión de ${rol}`, async ({ page }) => {
    if (!tieneCuenta(rol)) {
      // Estado vacío para que la configuración no falle; los casos de ese rol se omiten
      fs.writeFileSync(ESTADO_SESION[rol], JSON.stringify({ cookies: [], origins: [] }));
      fs.writeFileSync(TOKEN_SESION[rol], JSON.stringify({ token: null, cookieAceptada: false }));
      setup.skip(true, `Sin credenciales de ${rol} en .env`);
    }

    // Act – login, capturando la respuesta del backend
    const respuestaLogin = page.waitForResponse(
      (r) => r.url().includes('/auth/login') && r.request().method() === 'POST'
    );
    const login = new LoginPage(page);
    await login.ingresarComo(rol);
    const setCookie = (await (await respuestaLogin).allHeaders())['set-cookie'] || '';
    const token = /refreshToken=([^;]+)/.exec(setCookie)?.[1] ?? null;

    // Guardar sesión del navegador y anotar si aceptó la cookie
    const estado = await page.context().storageState({ path: ESTADO_SESION[rol] });
    const cookieAceptada = estado.cookies.some((c) => c.name === 'refreshToken');
    fs.writeFileSync(TOKEN_SESION[rol], JSON.stringify({ token, cookieAceptada }));

    setup.info().annotations.push({
      type: 'sesión',
      description: `Token capturado: ${token ? 'sí' : 'no'} · Cookie aceptada por el navegador: ${cookieAceptada ? 'sí' : 'no'}`,
    });
  });
}
