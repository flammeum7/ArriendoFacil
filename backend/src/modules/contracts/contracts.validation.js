const { z } = require('zod');

const dateStr = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida (formato esperado: YYYY-MM-DD)');

const create = z.object({
  body: z.object({
    tenantId: z.number().int().positive(),
    propertyId: z.number().int().positive(),
    startDate: dateStr,
    endDate: dateStr,
    rent: z.number().positive('El alquiler debe ser positivo'),
    deposit: z.number().positive('El depósito debe ser positivo'),
    conditions: z.string().max(2000).optional(),
    dueDayOffset: z.number().int().min(0).max(28).optional(),
  }),
});

const renew = z.object({
  body: z.object({
    startDate: dateStr,
    endDate: dateStr,
    rent: z.number().positive().optional(),
    deposit: z.number().positive().optional(),
    conditions: z.string().max(2000).optional(),
    dueDayOffset: z.number().int().min(0).max(28).optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

module.exports = { create, renew, byId };
