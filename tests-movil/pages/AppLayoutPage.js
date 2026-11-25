import { test, expect } from '@playwright/test';
import { LoginPage } from './LoginPage.js';
import { registrarHallazgo } from '../utils/responsive.js';

/** En el CSS del frontend (layout.css) el menú lateral se oculta por debajo de este ancho */
export const ANCHO_MENU_HAMBURGUESA = 860;

/** Texto del enlace del menú lateral para cada ruta, según el rol (Sidebar.jsx) */
const ENLACE_POR_RUTA = {
  arrendador: { '/contracts': 'Contratos', '/payments': 'Pagos', '/documents': 'Documentos' },
  arrendatario: { '/payments': 'Mis pagos', '/documents': 'Mis documentos' },
};

/**
 * Page Object base: estructura común a todas las pantallas internas
 * (encabezado, menú lateral, botón hamburguesa, tabla y modales).
 * ContratosPage, PagosPage y DocumentosPage heredan de esta clase.
 */
export class AppLayoutPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.login = new LoginPage(page);

    // Encabezado
    this.hamburguesa = page.getByRole('button', { name: 'Menú' });
    this.campana = page.getByRole('button', { name: 'Notificaciones' });
    this.botonSalir = page.getByRole('button', { name: 'Salir' });

    // Menú lateral (<aside> = rol "complementary") y su <nav>
    this.menuLateral = page.getByRole('complementary');
    this.navegacion = this.menuLateral.getByRole('navigation');
    // Capa oscura que aparece detrás del menú abierto en móvil (no tiene rol accesible)
    this.capaOscura = page.locator('.af-overlay.is-open');

    // Contenido
    this.contenido = page.getByRole('main');
    this.titulo = this.contenido.getByRole('heading', { level: 1 });
    this.tabla = this.contenido.getByRole('table');
  }

  /**
   * Abre una ruta interna con la sesión guardada.
   * Si el enlace directo no llega a la ruta (Render responde 301 → /index.html y la app
   * termina en Resumen), lo anota como hallazgo y llega por el menú, como un usuario.
   */
  async abrirRuta(ruta, rol = 'arrendador') {
    await this.login.abrirConSesion(ruta, rol);
    const actual = new URL(this.page.url()).pathname;
    if (actual === ruta) return;

    registrarHallazgo(test.info(),
      `INC: el enlace directo ${ruta} no abre la pantalla (termina en ${actual}). ` +
      'Render redirige (301) a /index.html en vez de reescribir.');
    await this.irDesdeMenu(ENLACE_POR_RUTA[rol][ruta]);
    await expect(this.page).toHaveURL(new RegExp(`${ruta}$`));
  }

  /** true si el ancho actual corresponde al diseño con menú hamburguesa */
  esModoHamburguesa() {
    return (this.page.viewportSize()?.width ?? 0) <= ANCHO_MENU_HAMBURGUESA;
  }

  enlaceMenu(nombre) {
    return this.navegacion.getByRole('link', { name: nombre, exact: true });
  }

  async abrirMenu() {
    await this.hamburguesa.click();
    await expect(this.menuLateral).toBeInViewport();
  }

  /**
   * Cierra el menú tocando la capa oscura, en el centro del área visible
   * entre el borde del menú y el borde de la capa (no en el borde de la pantalla,
   * donde el WebKit de Windows dibuja una barra de scroll que un iPhone real no tiene).
   */
  async cerrarMenuConCapa() {
    const menu = await this.menuLateral.boundingBox();
    const capa = await this.capaOscura.boundingBox();
    const x = Math.round((menu.x + menu.width + capa.x + capa.width) / 2);
    const y = Math.round(capa.y + capa.height / 2);
    await this.page.mouse.click(x, y);
    await expect(this.menuLateral).not.toBeInViewport();
  }

  /** Navega desde el menú lateral; en móvil abre antes la hamburguesa */
  async irDesdeMenu(nombre) {
    if (this.esModoHamburguesa()) await this.abrirMenu();
    await this.enlaceMenu(nombre).click();
  }

  /** Espera a que termine la carga (spinner) y se muestre la tabla */
  async esperarTabla() {
    await expect(this.tabla).toBeVisible();
  }

  /** Contenedor con overflow-x de la tabla (solo medible por clase CSS) */
  contenedorTabla() {
    return this.contenido.locator('.af-table-wrap');
  }

  /** Mide si la tabla se desplaza dentro de su propio contenedor */
  async medirScrollTabla() {
    return this.contenedorTabla().evaluate((el) => ({
      anchoVisible: el.clientWidth,
      anchoTabla: el.scrollWidth,
      tieneScrollInterno: el.scrollWidth > el.clientWidth,
    }));
  }

  /** Desplaza la tabla hasta el final (como deslizar el dedo a la izquierda) */
  async desplazarTablaAlFinal() {
    await this.contenedorTabla().evaluate((el) => { el.scrollLeft = el.scrollWidth; });
  }

  /** Filas de datos (sin el encabezado) que contienen un texto */
  filas(texto) {
    const filas = this.tabla.locator('tbody').getByRole('row');
    return texto ? filas.filter({ hasText: texto }) : filas;
  }

  /**
   * Modal identificado por su título.
   * Hallazgo: el componente Modal no usa role="dialog", por eso se ubica por su clase.
   */
  modal(titulo) {
    return this.page.locator('.af-modal').filter({
      has: this.page.getByRole('heading', { level: 2, name: titulo }),
    });
  }

  /** Combobox de filtro de estado (no tiene etiqueta; se reconoce por su primera opción) */
  filtroEstado() {
    return this.contenido.getByRole('combobox').filter({
      has: this.page.getByRole('option', { name: 'Todos los estados' }),
    });
  }
}
