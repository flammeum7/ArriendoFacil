// Prepara datos de prueba para las pruebas de estrés, picos, volumen y resistencia.
// Crea CONTRATOS contratos activos (cada uno con su propiedad), PAGOS pagos por contrato,
// repartidos entre ARRENDATARIOS arrendatarios (por defecto 1).
//
// Uso (desde la carpeta backend, SIEMPRE sobre la base de pruebas):
//   npx dotenv -e .env.test -v CONTRATOS=50 -v PAGOS=12 -- node tests/performance/datos/preparar-volumen.js
//   npx dotenv -e .env.test -v CONTRATOS=500 -v PAGOS=1 -v ARRENDATARIOS=100 -- node tests/performance/datos/preparar-volumen.js
//
// Recomendado: ejecutar antes "npm test" para partir de una base limpia y conocida.

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Protección: solo se ejecuta sobre la base de pruebas
if (!String(process.env.DATABASE_URL).includes('arriendofacil_test')) {
  console.error('Este script solo debe ejecutarse sobre la base de pruebas (arriendofacil_test).');
  process.exit(1);
}

const prisma = new PrismaClient();

const CONTRATOS = Number(process.env.CONTRATOS) || 50;
const PAGOS = Number(process.env.PAGOS) || 12; // pagos por contrato (uno por mes)
const ARRENDATARIOS = Number(process.env.ARRENDATARIOS) || 1;
const LOTE = 1000; // tamaño de cada inserción masiva

async function main() {
  const inicio = Date.now();

  const landlord = await prisma.user.findFirst({ where: { role: 'LANDLORD' } });
  if (!landlord) throw new Error('No hay arrendador en la base de pruebas. Ejecuta npm test primero.');

  // Arrendatarios dueños de los datos de volumen (k6.volumen@test.com, k6.volumen2@test.com, ...)
  const passwordHash = await bcrypt.hash('Tenant2026', 10);
  const tenants = [];
  for (let t = 0; t < ARRENDATARIOS; t++) {
    const email = t === 0 ? 'k6.volumen@test.com' : `k6.volumen${t + 1}@test.com`;
    tenants.push(await prisma.user.upsert({
      where: { email },
      update: { passwordHash, active: true, mustChangePassword: false, tempPasswordExpiresAt: null },
      create: {
        role: 'TENANT',
        fullName: `Arrendatario K6 Volumen ${t + 1}`,
        email,
        passwordHash,
        active: true,
        mustChangePassword: false,
      },
    }));
  }

  // Una propiedad por contrato (RF-05: un solo contrato vigente por propiedad)
  const marca = Date.now();
  const pagos = [];
  for (let c = 0; c < CONTRATOS; c++) {
    const tenant = tenants[c % tenants.length]; // reparto en ronda
    const property = await prisma.property.create({
      data: {
        address: `Propiedad K6 Volumen ${marca}-${c}`,
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
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: new Date('2030-12-31T00:00:00.000Z'),
        rent: 1000,
        deposit: 1000,
        dueDayOffset: 5,
        status: 'ACTIVE',
        activePropertyKey: property.id,
      },
    });

    // La primera mitad de los pagos queda pagada; el resto, pendiente
    for (let i = 0; i < PAGOS; i++) {
      const pagado = i < PAGOS / 2;
      pagos.push({
        contractId: contract.id,
        tenantId: tenant.id,
        periodStart: new Date(Date.UTC(2024, i, 1)),
        periodEnd: new Date(Date.UTC(2024, i + 1, 0)),
        dueDate: new Date(Date.UTC(2024, i, 6)),
        amount: 1000,
        status: pagado ? 'PAID' : 'PENDING',
        ...(pagado ? { paymentDate: new Date(Date.UTC(2024, i, 5)) } : {}),
      });
    }

    if ((c + 1) % 50 === 0) console.log(`  ${c + 1}/${CONTRATOS} contratos creados...`);
  }

  // Inserción de pagos por lotes (evita el límite de parámetros de MySQL)
  for (let i = 0; i < pagos.length; i += LOTE) {
    await prisma.payment.createMany({ data: pagos.slice(i, i + LOTE) });
  }

  const [totalContratos, totalPagos] = await Promise.all([
    prisma.contract.count(),
    prisma.payment.count(),
  ]);

  console.log(`Listo en ${((Date.now() - inicio) / 1000).toFixed(1)} s: +${CONTRATOS} contratos y +${pagos.length} pagos para ${tenants.length} arrendatario(s).`);
  console.log(`Totales en la base de pruebas: ${totalContratos} contratos, ${totalPagos} pagos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
