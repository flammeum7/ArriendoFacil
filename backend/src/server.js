const app = require('./app');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { startScheduler } = require('./jobs/scheduler');

const server = app.listen(env.port, () => {
  console.log(`ArriendoFácil API escuchando en ${env.backendUrl} (puerto ${env.port})`);
  console.log(`Zona horaria: ${env.tz} | Entorno: ${env.nodeEnv}`);
  startScheduler();
});

async function shutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
