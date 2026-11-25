import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage.js';
import { CUENTAS } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarTamanoTactil,
  verificarTipoTeclado,
  capturarEvidencia,
} from '../utils/responsive.js';

const { email: EMAIL, password: PASSWORD } = CUENTAS.arrendador;

test.describe('CP-MOV-01 Inicio de sesión en PC y móvil', () => {
  /** @type {LoginPage} */
  let login;
  /** @type {string[]} */
  let errores;

  // Arrange (común): abrir la pantalla de login sin sesión previa
  test.beforeEach(async ({ page }) => {
    expect(EMAIL, 'Falta TEST_EMAIL en el archivo .env').toBeTruthy();
    expect(PASSWORD, 'Falta TEST_PASSWORD en el archivo .env').toBeTruthy();
    // El 401 de /auth/login es la respuesta esperada en el login inválido
    errores = vigilarConsola(page, [/\/auth\/login/]);
    login = new LoginPage(page);
    await login.abrir();
  });

  test('CP-MOV-01a Login válido: la pantalla se adapta y permite ingresar', async ({ page }, testInfo) => {
    // Assert – diseño adaptable
    await expect(login.correo).toBeVisible();
    await expect(login.clave).toBeVisible();
    await expect(login.botonIngresar).toBeVisible();
    await verificarSinScrollHorizontal(page, 'en /login');

    // Assert – interacción táctil y teclado móvil
    await verificarTamanoTactil(login.botonIngresar, 'Botón Ingresar');
    await verificarTipoTeclado(login.correo, 'email', 'Campo correo');
    await verificarTipoTeclado(login.clave, 'password', 'Campo contraseña');

    await capturarEvidencia(page, testInfo, 'CP-MOV-01a', 'antes');

    // Act
    await login.iniciarSesion(EMAIL, PASSWORD);

    // Assert – resultado: redirige a "/" y muestra el Resumen
    await login.esperarInicio();
    await verificarSinScrollHorizontal(page, 'en la pantalla de inicio');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-01a', 'despues');
  });

  test('CP-MOV-01b Login inválido: el mensaje de error se ve sin hacer scroll', async ({ page }, testInfo) => {
    // Act
    await login.iniciarSesion(EMAIL, 'ClaveIncorrecta1');

    // Assert
    await expect(login.mensajeError).toBeVisible();
    await expect(login.mensajeError).toBeInViewport();
    await expect(page).toHaveURL(/\/login/);
    await verificarSinScrollHorizontal(page, 'con el mensaje de error');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-01b');
  });
});
