require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_LANDLORD_EMAIL;
  const password = process.env.SEED_LANDLORD_PASSWORD;
  const fullName = process.env.SEED_LANDLORD_NAME || 'Administrador ArriendoFácil';

  if (!email || !password) {
    throw new Error(
      'Faltan SEED_LANDLORD_EMAIL o SEED_LANDLORD_PASSWORD en el archivo .env'
    );
  }

  // Seed idempotente: si ya existe un arrendador, no crea otro.
  const existing = await prisma.user.findFirst({ where: { role: 'LANDLORD' } });
  if (existing) {
    console.log(`Arrendador ya existe (${existing.email}). Seed omitido.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const landlord = await prisma.user.create({
    data: {
      role: 'LANDLORD',
      fullName,
      email,
      passwordHash,
      active: true,
      mustChangePassword: false,
    },
  });

  console.log(`Arrendador creado correctamente: ${landlord.email}`);
}

main()
  .catch((e) => {
    console.error('Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
