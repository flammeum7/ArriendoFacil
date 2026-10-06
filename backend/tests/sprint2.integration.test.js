/**
 * SPRINT 2 — Pruebas de Integración
 * CP-03: Unicidad de contrato vigente por propiedad (servicio + BD).
 */
const contractsService = require('../src/modules/contracts/contracts.service');
const {
  prisma, resetDb, seedLandlord, seedTenant, seedProperty, seedActiveContract,
} = require('./helpers/db');
const { CONTRACT_STATUS, PROPERTY_STATUS } = require('../src/config/constants');

let landlord, tenant, property;

beforeEach(async () => {
  await resetDb();
  landlord = await seedLandlord();
  tenant = await seedTenant();
  property = await seedProperty(landlord.id);
});
afterAll(async () => { await prisma.$disconnect(); });

describe('CP-03 - Unicidad de contrato vigente por propiedad (RF-05)', () => {
  test('rechaza crear un segundo contrato ACTIVE sobre la misma propiedad', async () => {
    await seedActiveContract(tenant.id, property.id);

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

    const prop = await prisma.property.findUnique({ where: { id: property.id } });
    expect(prop.status).toBe(PROPERTY_STATUS.OCCUPIED);
  });
});