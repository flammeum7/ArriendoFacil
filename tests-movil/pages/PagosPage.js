import { expect } from '@playwright/test';
import { AppLayoutPage } from './AppLayoutPage.js';

/**
 * Page Object: pantalla Pagos (/payments)
 * - Arrendatario: "Subir comprobante" (modal con archivo y método de pago).
 * - Arrendador: "Aprobar" (confirmación nativa del navegador) y "Rechazar" (modal con motivo).
 */
export class PagosPage extends AppLayoutPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);

    // Botones dentro de la tabla
    this.botonesSubir = this.tabla.getByRole('button', { name: 'Subir comprobante' });
    this.botonesAprobar = this.tabla.getByRole('button', { name: 'Aprobar' });
    this.botonesRechazar = this.tabla.getByRole('button', { name: 'Rechazar' });

    // Modal "Subir comprobante · Pago #N"
    // Hallazgo: el input de archivo y el select no están asociados a su <label>,
    // por eso se ubican por tipo/rol dentro del modal y no con getByLabel.
    this.modalSubir = this.modal(/Subir comprobante/);
    this.inputArchivo = this.modalSubir.locator('input[type="file"]');
    this.metodoPago = this.modalSubir.getByRole('combobox');
    this.botonConfirmarSubida = this.modalSubir.getByRole('button', { name: 'Subir', exact: true });
    this.botonCancelarSubida = this.modalSubir.getByRole('button', { name: 'Cancelar' });

    // Modal "Rechazar comprobante · Pago #N"
    this.modalRechazo = this.modal(/Rechazar comprobante/);
    this.motivoRechazo = this.modalRechazo.getByRole('textbox');
    this.botonConfirmarRechazo = this.modalRechazo.getByRole('button', { name: 'Rechazar' });
    this.botonCancelarRechazo = this.modalRechazo.getByRole('button', { name: 'Cancelar' });
    this.errorRechazo = this.modalRechazo.getByText('Indica el motivo del rechazo');
  }

  async abrir(rol = 'arrendador') {
    await this.abrirRuta('/payments', rol);
    await expect(this.titulo).toHaveText('Pagos');
    await this.esperarTabla();
  }

  /**
   * Primera fila de la tabla que tiene un botón con ese nombre.
   * El localizador dentro de "has" debe ser relativo (page.getByRole), no partir de la tabla.
   */
  filaConBoton(nombreBoton) {
    return this.tabla.getByRole('row')
      .filter({ has: this.page.getByRole('button', { name: nombreBoton }) })
      .first();
  }

  /** Número del pago (#N) de la fila: está en la primera celda */
  async idDeFila(fila) {
    const texto = await fila.getByRole('cell').first().textContent();
    return texto?.replace('#', '').trim();
  }

  // ─── Arrendatario ───
  async abrirModalSubir() {
    const fila = this.filaConBoton('Subir comprobante');
    const id = await this.idDeFila(fila);
    await fila.getByRole('button', { name: 'Subir comprobante' }).click();
    await expect(this.modalSubir).toBeVisible();
    return id;
  }

  /** Adjunta un archivo en memoria (simula elegirlo desde la galería del teléfono) */
  async adjuntarComprobante(archivo) {
    await this.inputArchivo.setInputFiles(archivo);
  }

  // ─── Arrendador ───
  /**
   * Pulsa "Aprobar" y responde la ventana de confirmación del navegador.
   * @param {boolean} aceptar true = aprueba de verdad; false = cancela
   * @returns {Promise<string>} texto de la confirmación
   */
  async aprobarPrimero(aceptar) {
    // El manejador se registra ANTES del clic y responde en el mismo instante en que
    // aparece la confirmación; si no, Playwright la cierra sola (cancelar) por defecto.
    let mensaje = '';
    const atendida = new Promise((resolver) => {
      this.page.once('dialog', async (d) => {
        mensaje = d.message();
        aceptar ? await d.accept() : await d.dismiss();
        resolver();
      });
    });
    await this.botonesAprobar.first().click();
    await atendida;
    return mensaje;
  }

  async abrirModalRechazo() {
    const fila = this.filaConBoton('Rechazar');
    const id = await this.idDeFila(fila);
    await fila.getByRole('button', { name: 'Rechazar' }).click();
    await expect(this.modalRechazo).toBeVisible();
    return id;
  }
}
