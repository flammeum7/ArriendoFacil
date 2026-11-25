import { test, expect } from '@playwright/test';

/** Tamaño mínimo recomendado para elementos táctiles (WCAG 2.5.5 / guías de Apple) */
export const TAMANO_TACTIL_MIN = 44;

// ───────────────────────── Compatibilidad ─────────────────────────

/** Errores esperados que no indican un problema (p. ej. 401 de /auth/refresh sin sesión) */
const IGNORAR_POR_DEFECTO = [/\/auth\/refresh/];

/**
 * Empieza a registrar errores de consola y excepciones de JavaScript de la página.
 * Llamar ANTES de navegar. Devuelve el arreglo que se va llenando.
 * @param {import('@playwright/test').Page} page
 * @param {RegExp[]} ignorar URLs cuyos errores de red son esperados en el caso
 */
export function vigilarConsola(page, ignorar = []) {
  const patrones = [...IGNORAR_POR_DEFECTO, ...ignorar];
  const errores = [];
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const url = msg.location()?.url || '';
    if (patrones.some((p) => p.test(url) || p.test(msg.text()))) return;
    errores.push(`[consola] ${msg.text()} ${url}`.trim());
  });
  page.on('pageerror', (err) => errores.push(`[excepción] ${err.message}`));
  return errores;
}

/** Verifica (soft) que la página cargó sin errores de consola ni excepciones */
export function verificarSinErroresConsola(errores, contexto = '') {
  expect.soft(errores, `Sin errores en consola ${contexto}`.trim()).toEqual([]);
}

// ───────────────────────── Diseño adaptable ─────────────────────────

/** true si la página NO tiene scroll horizontal (criterio de diseño adaptable) */
export async function sinScrollHorizontal(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth
  );
}

/** Verifica (soft) que no haya scroll horizontal; registra el hallazgo sin cortar la prueba */
export async function verificarSinScrollHorizontal(page, contexto = '') {
  expect
    .soft(await sinScrollHorizontal(page), `Sin scroll horizontal ${contexto}`.trim())
    .toBe(true);
}

/** Verifica (soft) que el elemento quepa a lo ancho de la pantalla (no se corta) */
export async function verificarDentroDelAncho(page, locator, nombre) {
  const caja = await locator.boundingBox();
  const ancho = page.viewportSize()?.width ?? 0;
  expect.soft(caja, `${nombre}: se renderiza`).not.toBeNull();
  if (!caja) return;
  expect.soft(caja.x, `${nombre}: no se corta a la izquierda`).toBeGreaterThanOrEqual(0);
  expect.soft(Math.round(caja.x + caja.width), `${nombre}: no se corta a la derecha (ancho ${ancho}px)`)
    .toBeLessThanOrEqual(ancho);
}

// ───────────────────────── Interacción ─────────────────────────

/** true si el dispositivo del proyecto actual tiene pantalla táctil (Pixel 7, iPhone 13, iPad) */
export function esDispositivoTactil() {
  return Boolean(test.info().project.use.hasTouch);
}

/**
 * Verifica (soft) que un elemento tenga alto mínimo para tocarlo con el dedo.
 * En PC (sin pantalla táctil) el criterio no aplica: solo se anota en el reporte.
 */
export async function verificarTamanoTactil(locator, nombre) {
  if (!esDispositivoTactil()) {
    const info = test.info();
    if (!info.annotations.some((a) => a.type === 'táctil')) {
      info.annotations.push({ type: 'táctil', description: 'No aplica en PC: se usa mouse, no se mide el tamaño ≥ 44 px' });
    }
    return;
  }
  const caja = await locator.boundingBox();
  expect.soft(caja?.height ?? 0, `${nombre}: alto ≥ ${TAMANO_TACTIL_MIN}px`)
    .toBeGreaterThanOrEqual(TAMANO_TACTIL_MIN);
}

/**
 * Verifica (soft) el tipo de input, que define el teclado que abre el móvil:
 * email → teclado con @, number → teclado numérico, date → selector de fecha nativo.
 */
export async function verificarTipoTeclado(locator, tipo, nombre) {
  await expect.soft(locator, `${nombre}: type="${tipo}" (teclado/selector adecuado)`)
    .toHaveAttribute('type', tipo);
}

// ───────────────────────── Evidencias ─────────────────────────

/** Anota un hallazgo en el reporte HTML sin marcar la prueba como fallida */
export function registrarHallazgo(testInfo, descripcion) {
  testInfo.annotations.push({ type: 'hallazgo', description: descripcion });
}

/**
 * Guarda una captura con nombre ordenado y la adjunta al reporte HTML.
 * Ej.: evidencias/CP-MOV-01a_D-03_Pixel_7_antes.png
 */
export async function capturarEvidencia(page, testInfo, caso, momento = '') {
  const dispositivo = testInfo.project.name.replace(/\s+/g, '_');
  const sufijo = momento ? `_${momento}` : '';
  const ruta = `evidencias/${caso}_${dispositivo}${sufijo}.png`;
  await page.screenshot({ path: ruta, fullPage: true });
  await testInfo.attach(`${caso}${sufijo}`, { path: ruta, contentType: 'image/png' });
}
