import { test, expect } from '@playwright/test';
import { CUENTAS } from '../utils/entorno.js';
import { activarSesionGuardada } from '../utils/sesion.js';
import { registrarHallazgo } from '../utils/responsive.js';

/**
 * Page Object: pantalla de inicio de sesión (/login)
 * Reúne los elementos y acciones de la pantalla para reutilizarlos en todos los casos.
 */
export class LoginPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.correo = page.getByLabel('Correo electrónico');
    this.clave = page.getByLabel('Contraseña');
    this.botonIngresar = page.getByRole('button', { name: 'Ingresar' });
    this.mensajeError = page.getByText(/Credenciales inválidas/i);
    this.tituloInicio = page.getByRole('heading', { level: 1, name: 'Resumen' });
  }

  async abrir() {
    await this.page.goto('/login');
    await expect(this.correo).toBeVisible();
  }

  async iniciarSesion(email, password) {
    await this.correo.fill(email);
    await this.clave.fill(password);
    await this.botonIngresar.click(); // click() funciona en táctil y escritorio
  }

  /** Tras un login exitoso la app redirige a "/" (Resumen) */
  async esperarInicio() {
    await expect(this.page).toHaveURL(/\/$/);
    await expect(this.tituloInicio).toBeVisible();
  }

  /** Abre el login e ingresa con la cuenta de prueba del rol indicado */
  async ingresarComo(rol = 'arrendador') {
    await this.abrir();
    await this.iniciarSesion(CUENTAS[rol].email, CUENTAS[rol].password);
    await this.esperarInicio();
  }

  /** Atajo usado por los casos de arrendador */
  async ingresarComoArrendador() {
    await this.ingresarComo('arrendador');
  }

  /**
   * Abre una ruta protegida reutilizando la sesión guardada.
   * Si la sesión no se pudo restaurar (la app manda a /login), inicia sesión de nuevo.
   */
  async abrirConSesion(ruta, rol = 'arrendador') {
    await activarSesionGuardada(this.page, rol);
    await this.page.goto(ruta);
    // Esperar a que la app decida: muestra la página (h1 dentro de <main>) o el login
    const tituloPagina = this.page.getByRole('main').getByRole('heading', { level: 1 });
    await expect(tituloPagina.or(this.correo)).toBeVisible();
    if (await this.correo.isVisible()) {
      registrarHallazgo(test.info(), 'No se pudo restaurar la sesión guardada: se inició sesión de nuevo (respaldo)');
      await this.iniciarSesion(CUENTAS[rol].email, CUENTAS[rol].password);
      // La app vuelve sola a la ruta pedida (state.from) tras el login
      await expect(this.page).not.toHaveURL(/\/login/);
      await expect(tituloPagina).toBeVisible();
    }
  }
}
