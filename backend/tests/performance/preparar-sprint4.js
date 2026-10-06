const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Protección: solo se ejecuta sobre la base de pruebas
if (!String(process.env.DATABASE_URL).includes('arriendofacil_test')) {
  console.error('Este script solo debe ejecutarse sobre la base de pruebas (arriendofacil_test).');
  process.exit(1);
}

const prisma = new PrismaClient();
const TOTAL_PAGOS = 50;

async function main() {
  const landlord = await prisma.user.findFirst({ where: { role: 'LANDLORD' } });
  if (!landlord) throw new Error('No hay arrendador en la base de pruebas. Ejecuta npm test primero.');

  // Arrendatario con contraseña conocida
  const passwordHash = await bcrypt.hash('Tenant2026', 10);
  const tenant = await prisma.user.upsert({
    where: { email: 'k6.pagos@test.com' },
    update: { passwordHash, active: true, mustChangePassword: false, tempPasswordExpiresAt: null },
    create: {
      role: 'TENANT',
      fullName: 'Arrendatario K6 Pagos',
      email: 'k6.pagos@test.com',
      passwordHash,
      active: true,
      mustChangePassword: false,
    },
  });

  const property = await prisma.property.create({
    data: {
      address: `Propiedad K6 Pagos ${Date.now()}`,
      type: 'APARTMENT',
      referenceRent: 1000,
      status: 'OCCUPIED',
      ownerId: landlord.id,
    },
  });

  const contract = await prisma.contract.create({
    data: {
      tenantId: tenant.id,
      propertyId: property.id,
      startDate: new Date('2020-01-01T00:00:00.000Z'),
      endDate: new Date('2030-12-31T00:00:00.000Z'),
      rent: 1000,
      deposit: 1000,
      dueDayOffset: 5,
      status: 'ACTIVE',
      activePropertyKey: property.id,
    },
  });

  // 50 pagos pendientes (uno por mes)
  const pagos = [];
  for (let i = 0; i < TOTAL_PAGOS; i++) {
    pagos.push({
      contractId: contract.id,
      tenantId: tenant.id,
      periodStart: new Date(Date.UTC(2020, i, 1)),
      periodEnd: new Date(Date.UTC(2020, i + 1, 0)),
      dueDate: new Date(Date.UTC(2020, i, 6)),
      amount: 1000,
      status: 'PENDING',
    });
  }
  await prisma.payment.createMany({ data: pagos });

  console.log(`Listo: ${tenant.email} con ${TOTAL_PAGOS} pagos pendientes (contrato #${contract.id}).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());