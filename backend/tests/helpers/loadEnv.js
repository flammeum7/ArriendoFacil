/**
 * Carga las variables de entorno del archivo .env.test.
 * Se ejecuta ANTES de cualquier prueba (configurado en jest.config.js -> setupFiles),
 * garantizando que Prisma y la app usen la base de datos de PRUEBAS (arriendofacil_test)
 * y nunca la base de desarrollo.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// Salvaguarda: si por error no se cargó el entorno de test, abortamos
// para no correr las pruebas (que borran datos) contra la base equivocada.
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    'Las pruebas deben ejecutarse con NODE_ENV=test. Verifica el archivo .env.test'
  );
}
