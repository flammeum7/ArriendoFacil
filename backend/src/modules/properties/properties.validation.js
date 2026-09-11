const { z } = require('zod');
const { PROPERTY_TYPE, PROPERTY_STATUS } = require('../../config/constants');

const create = z.object({
  body: z.object({
    address: z.string().min(3, 'La dirección es obligatoria'),
    type: z.nativeEnum(PROPERTY_TYPE),
    unitNumber: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    rooms: z.number().int().min(0).optional(),
    referenceRent: z.number().positive('El alquiler de referencia debe ser positivo'),
  }),
});

const update = z.object({
  body: z.object({
    address: z.string().min(3).optional(),
    type: z.nativeEnum(PROPERTY_TYPE).optional(),
    unitNumber: z.string().max(50).optional(),
    description: z.string().max(1000).optional(),
    rooms: z.number().int().min(0).optional(),
    referenceRent: z.number().positive().optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const changeStatus = z.object({
  body: z.object({ status: z.nativeEnum(PROPERTY_STATUS) }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

module.exports = { create, update, changeStatus, byId };
