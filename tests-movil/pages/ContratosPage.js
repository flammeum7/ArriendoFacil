import { expect } from '@playwright/test';
import { AppLayoutPage } from './AppLayoutPage.js';

/**
 * Page Object: pantalla Contratos (/contracts, solo arrendador)
 * Incluye el listado y el modal "Nuevo contrato" con los selectores de fecha.
 */
export class ContratosPage extends AppLayoutPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    super(page);
    this.botonNuevo = page.getByRole('button', { name: '+ Nuevo contrato' });

    // Modal "Nuevo contrato"
    this.modalNuevo = this.modal('Nuevo contrato');
    this.arrendatario = this.modalNuevo.getByLabel('Arrendatario');
    this.propiedad = this.modalNuevo.getByLabel('Propiedad (disponibles)');
    this.fechaInicio = this.modalNuevo.getByLabel('Fecha de inicio');
    this.fechaVencimiento = this.modalNuevo.getByLabel('Fecha de vencimiento');
    this.alquiler = this.modalNuevo.getByLabel('Alquiler mensual (S/)');
    this.deposito = this.modalNuevo.getByLabel('Depósito (S/)');
    this.diasVencimientoPago = this.modalNuevo.getByLabel('Días para el vencimiento del pago');
    this.botonCrear = this.modalNuevo.getByRole('button', { name: 'Crear contrato' });
    this.botonCancelar = this.modalNuevo.getByRole('button', { name: 'Cancelar' });
    this.mensajeErrorModal = this.modalNuevo.locator('.af-alert--error');
  }

  async abrir() {
    await this.abrirRuta('/contracts');
    await expect(this.titulo).toHaveText('Contratos');
    await this.esperarTabla();
  }

  async abrirModalNuevo() {
    await this.botonNuevo.click();
    await expect(this.modalNuevo).toBeVisible();
  }

  /**
   * Elige la primera opción real de un <select> cargado por la API.
   * Devuelve el texto elegido o null si la lista está vacía.
   */
  async elegirPrimeraOpcion(select) {
    const opciones = select.locator('option');
    try {
      await expect(opciones).not.toHaveCount(1, { timeout: 15_000 }); // 1 = solo "Selecciona..."
    } catch {
      return null;
    }
    await select.selectOption({ index: 1 });
    return (await opciones.nth(1).textContent())?.trim() ?? null;
  }

  /** Llena el formulario; devuelve los textos elegidos (o null si faltan datos) */
  async llenarFormulario({ inicio, vencimiento, alquiler = '850', deposito = '850', dias = '5' }) {
    const arrendatario = await this.elegirPrimeraOpcion(this.arrendatario);
    const propiedad = await this.elegirPrimeraOpcion(this.propiedad);
    await this.fechaInicio.fill(inicio); // formato del input date: AAAA-MM-DD
    await this.fechaVencimiento.fill(vencimiento);
    await this.alquiler.fill(alquiler);
    await this.deposito.fill(deposito);
    await this.diasVencimientoPago.fill(dias);
    return { arrendatario, propiedad };
  }

  async cancelarModal() {
    await this.botonCancelar.click();
    await expect(this.modalNuevo).toBeHidden();
  }

  async guardarContrato() {
    await this.botonCrear.click();
    await expect(this.modalNuevo).toBeHidden({ timeout: 30_000 });
    await this.esperarTabla();
  }

  /**
   * Texto que la app DEBERÍA mostrar para una fecha AAAA-MM-DD,
   * calculado en el propio navegador con la misma configuración regional (es-PE).
   */
  async fechaEsperadaEnPantalla(fechaISO) {
    return this.page.evaluate((iso) => {
      const [a, m, d] = iso.split('-').map(Number);
      return new Date(a, m - 1, d).toLocaleDateString('es-PE');
    }, fechaISO);
  }
}
