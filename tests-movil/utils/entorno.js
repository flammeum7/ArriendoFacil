/**
 * Datos de entorno leídos del archivo .env (nunca se escriben credenciales en el código).
 */
export const CUENTAS = {
  arrendador: { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD },
  arrendatario: { email: process.env.TEST_TENANT_EMAIL, password: process.env.TEST_TENANT_PASSWORD },
};

/** Sesiones guardadas por tests/auth.setup.js (carpeta ignorada por git) */
export const ESTADO_SESION = {
  arrendador: '.auth/arrendador.json',
  arrendatario: '.auth/arrendatario.json',
};

/**
 * Refresh token capturado en el login del setup (carpeta ignorada por git).
 * Se usa porque el navegador rechaza la cookie (SameSite=Strict entre sitios distintos).
 */
export const TOKEN_SESION = {
  arrendador: '.auth/arrendador.token.json',
  arrendatario: '.auth/arrendatario.token.json',
};

/** Solo si es true los casos guardan datos reales en la web hosteada */
export const PERMITIR_ESCRITURA = process.env.PERMITIR_ESCRITURA === 'true';

/** true si hay credenciales completas para el rol indicado */
export const tieneCuenta = (rol) => Boolean(CUENTAS[rol]?.email && CUENTAS[rol]?.password);
