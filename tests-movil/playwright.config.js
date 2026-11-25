// @ts-check
import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de las pruebas móviles y responsive (Sección 14.1 – APF3)
 * Sistema bajo prueba: Arriendo Fácil (web hosteada en Render)
 */
export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  // Una prueba a la vez: evita el rate limit del login en la web hosteada
  workers: 1,
  fullyParallel: false,

  // Render (plan gratuito) "se duerme" y tarda en despertar
  timeout: 90_000,
  expect: { timeout: 10_000 },

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'resultados-movil.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://arriendofacil-qbko.onrender.com',
    navigationTimeout: 60_000,
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    locale: 'es-PE',
    timezoneId: 'America/Lima',
  },

  // Matriz de dispositivos (tabla 14.1.2)
  projects: [
    // Paso previo: inicia sesión una vez por rol y guarda la sesión en .auth/
    { name: 'setup', testMatch: /auth\.setup\.js/, use: { ...devices['Desktop Chrome'] } },

    { name: 'D-01 PC Chrome', use: { ...devices['Desktop Chrome'] },   dependencies: ['setup'] },
    { name: 'D-02 PC Safari', use: { ...devices['Desktop Safari'] },   dependencies: ['setup'] },
    { name: 'D-03 Pixel 7',   use: { ...devices['Pixel 7'] },          dependencies: ['setup'] },
    { name: 'D-04 iPhone 13', use: { ...devices['iPhone 13'] },        dependencies: ['setup'] },
    { name: 'D-05 iPad',      use: { ...devices['iPad (gen 7)'] },     dependencies: ['setup'] },
  ],
});
