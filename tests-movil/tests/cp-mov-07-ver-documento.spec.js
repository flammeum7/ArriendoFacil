import { test, expect } from '@playwright/test';
import { DocumentosPage } from '../pages/DocumentosPage.js';
import { ESTADO_SESION } from '../utils/entorno.js';
import {
  vigilarConsola,
  verificarSinErroresConsola,
  verificarSinScrollHorizontal,
  verificarTamanoTactil,
  registrarHallazgo,
  capturarEvidencia,
} from '../utils/responsive.js';

test.use({ storageState: ESTADO_SESION.arrendador });

test.describe('CP-MOV-07 Abrir o descargar un documento PDF', () => {
  test('CP-MOV-07 El documento se descarga del servidor y se abre en otra pestaña', async ({ page }, testInfo) => {
    // Arrange
    const errores = vigilarConsola(page);
    const documentos = new DocumentosPage(page);
    await documentos.abrir();
    await verificarSinScrollHorizontal(page, 'en /documents');
    test.skip((await documentos.botonesVer.count()) === 0, 'No hay documentos registrados');
    const fila = await documentos.filaDocumento();
    const nombreArchivo = (await fila.getByRole('cell').first().textContent())?.trim();
    await fila.getByRole('button', { name: 'Ver' }).scrollIntoViewIfNeeded();
    await verificarTamanoTactil(fila.getByRole('button', { name: 'Ver' }), 'Botón Ver');
    await capturarEvidencia(page, testInfo, 'CP-MOV-07', 'listado');

    // Act
    const { respuesta, pestana } = await documentos.verDocumento(fila);

    // Assert – compatibilidad: el servidor entrega el archivo con su tipo correcto
    expect(respuesta.status(), `Descarga de "${nombreArchivo}"`).toBe(200);
    const tipo = respuesta.headers()['content-type'] || '';
    testInfo.annotations.push({ type: 'archivo', description: `${nombreArchivo} → ${tipo}` });
    if (/\.pdf$/i.test(nombreArchivo || '')) {
      expect.soft(tipo, 'Content-Type de un PDF').toContain('application/pdf');
    }

    // Assert – se abre en una pestaña nueva. Mostrar el PDF depende del visor del navegador:
    // los navegadores móviles emulados abren la pestaña pero no muestran el PDF, así que
    // eso se anota para verificarlo en un celular real (no se marca como fallo).
    if (pestana) {
      const muestraPdf = await pestana.waitForURL(/^blob:/, { timeout: 10_000 })
        .then(() => true).catch(() => false);
      if (muestraPdf) {
        await pestana.screenshot({ path: `evidencias/CP-MOV-07_${testInfo.project.name.replace(/\s+/g, '_')}_pestana.png` })
          .catch(() => registrarHallazgo(testInfo, 'La pestaña del PDF no se pudo capturar (visor nativo del navegador)'));
      } else {
        registrarHallazgo(testInfo,
          'Se abrió la pestaña nueva pero el navegador no mostró el PDF. Verificar en un celular real: ' +
          'window.open se llama después de descargar el archivo y Safari en iOS suele bloquear esas ventanas.');
      }
      testInfo.annotations.push({ type: 'pestaña', description: muestraPdf ? 'PDF mostrado en pestaña nueva' : 'Pestaña abierta sin mostrar el PDF' });
      await pestana.close();
    } else {
      registrarHallazgo(testInfo, 'No se abrió pestaña nueva: el navegador bloqueó window.open o descargó el archivo directamente');
    }

    await expect(documentos.titulo).toHaveText('Documentos');
    verificarSinErroresConsola(errores);
    await capturarEvidencia(page, testInfo, 'CP-MOV-07', 'despues');
  });
});
