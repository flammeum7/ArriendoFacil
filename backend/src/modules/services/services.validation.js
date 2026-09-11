const { z } = require('zod');
const { SERVICE_TYPE } = require('../../config/constants');

const create = z.object({
  body: z.object({
    tenantId: z.number().int().positive(),
    type: z.nativeEnum(SERVICE_TYPE),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Periodo inválido (formato YYYY-MM)'),
    consumption: z.number().nonnegative().optional(),
    unit: z.string().max(20).optional(),
    amount: z.number().positive('El monto debe ser positivo'),
    observations: z.string().max(500).optional(),
  }),
});

const update = z.object({
  body: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
    consumption: z.number().nonnegative().optional(),
    unit: z.string().max(20).optional(),
    amount: z.number().positive().optional(),
    observations: z.string().max(500).optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

module.exports = { create, update, byId };
