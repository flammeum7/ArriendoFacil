/**
 * Pruebas de INTEGRACION de contratos (usan la BD de test real).
 *  - CP-03: unicidad de contrato vigente por propiedad (RF-05).
 *  - CP-06: renovar y luego intentar cancelar un contrato ya renovado (RF-07).
 *
 * Se apoyan en el servicio de contratos + Prisma contra arriendofacil_test.
 */
const contractsService = require('../src/modules/contracts/contracts.service');
const {
  prisma,
  resetDb,
  seedLandlord,
  seedTenant,
  seedProperty,
  seedActiveContract,
} = require('./helpers/db');
const { CONTRACT_STATUS, PROPERTY_STATUS } = require('../src/config/constants');

let landlord;
let tenant;
let property;

beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('CP-03 - Unicidad de contrato vigente por propiedad (RF-05)', () => {
  test('rechaza crear un segundo contrato ACTIVE sobre la misma propiedad', async () => {
    // Precondicion: la propiedad ya tiene un contrato ACTIVE
    await seedActiveContract(tenant.id, property.id);

    // Intento de crear un segundo contrato vigente sobre la misma propiedad
    const segundoContrato = {
      tenantId: tenant.id,
      propertyId: property.id,
      startDate: '2026-02-01',
      endDate: '2027-01-31',
      rent: 1300,
      deposit: 1300,
    };

    await expect(
      contractsService.create(landlord.id, segundoContrato)
    ).rejects.toThrow('La propiedad ya tiene un contrato vigente');
  });

  test('permite crear un contrato si la propiedad no tiene ninguno vigente', async () => {
    const contrato = {
      tenantId: tenant.id,
      propertyId: property.id,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rent: 1200,
      deposit: 1200,
    };

    const creado = await contractsService.create(landlord.id, contrato);
    expect(creado.status).toBe(CONTRACT_STATUS.ACTIVE);

    // La propiedad debe quedar OCCUPIED
    const prop = await prisma.property.findUnique({ where: { id: property.id } });
    expect(prop.status).toBe(PROPERTY_STATUS.OCCUPIED);
  });
});

describe('CP-06 - Transiciones validas de contrato: renovar y cancelar (RF-07)', () => {
  test('renueva un contrato ACTIVE y luego rechaza cancelar el ya RENEWED', async () => {
    // Precondicion: contrato ACTIVE sobre la propiedad
    const original = await seedActiveContract(tenant.id, property.id);

    // 1) Renovar el contrato activo
    const nuevo = await contractsService.renew(landlord.id, original.id, {
      startDate: '2027-01-01',
      endDate: '2027-12-31',
    });

    // El original queda RENEWED, el nuevo ACTIVE
    const originalActualizado = await prisma.contract.findUnique({
      where: { id: original.id },
    });
    expect(originalActualizado.status).toBe(CONTRACT_STATUS.RENEWED);
    expect(nuevo.status).toBe(CONTRACT_STATUS.ACTIVE);

    // La propiedad sigue OCCUPIED
    const prop = await prisma.property.findUnique({ where: { id: property.id } });
    expect(prop.status).toBe(PROPERTY_STATUS.OCCUPIED);

    // 2) Intentar cancelar el contrato ya RENEWED -> debe fallar
    await expect(
      contractsService.cancel(landlord.id, original.id)
    ).rejects.toThrow('Solo se puede cancelar un contrato vigente');
  });
});
