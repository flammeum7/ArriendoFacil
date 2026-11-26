import { expect } from '@playwright/test';
import { AppLayoutPage } from './AppLayoutPage.js';

/**
 * Page Object: pantalla Documentos (/documents)
 * El botón "Ver" descarga el archivo protegido (GET /documents/:id/download con el token)
 * y lo abre en una pestaña nueva como blob (window.open).
 */
export class DocumentosPage extends AppLayoutPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.botonesVer = this.tabla.getByRole('button', { name: 'Ver' });
    this.botonSubir = page.getByRole('button', { name: '+ Subir documento' });
  }

  async abrir(rol = 'arrendador') {
    await this.abrirRuta('/documents', rol);
    await expect(this.titulo).toHaveText('Documentos');
    await this.esperarTabla();
  }

  /** Primera fila cuyo archivo es PDF (si no hay, la primera fila) */
  async filaDocumento() {
    const pdf = this.filas(/\.pdf/i).first();
    return (await pdf.count()) > 0 ? pdf : this.filas().first();
  }

  /**
   * Pulsa "Ver" en la fila y espera la respuesta del servidor y la pestaña nueva.
   * @returns {Promise<{ respuesta: import('@playwright/test').Response,
   *                     pestana: import('@playwright/test').Page | null }>}
   */
  async verDocumento(fila) {
    const respuesta = this.page.waitForResponse((r) => /\/documents\/\d+\/download/.test(r.url()));
    const pestana = this.page.context().waitForEvent('page', { timeout: 15_000 }).catch(() => null);
    await fila.getByRole('button', { name: 'Ver' }).click();
    return { respuesta: await respuesta, pestana: await pestana };
  }
}
