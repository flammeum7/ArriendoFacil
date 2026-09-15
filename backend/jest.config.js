/**
 * Configuración de Jest para las pruebas de ArriendoFácil.
 * - testEnvironment node: pruebas de backend (sin DOM).
 * - setupFiles: carga las variables de entorno de .env.test ANTES de todo.
 * - testTimeout alto: las pruebas de integración tocan la BD real.
 * - maxWorkers 1: evita que varias suites escriban en la misma BD a la vez.
 */
module.exports = {
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/tests/helpers/loadEnv.js'],
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  maxWorkers: 1,
  verbose: true,
};
