const { z } = require('zod');

const dni = z.string().regex(/^\d{8}$/, 'El DNI debe tener exactamente 8 dígitos');

const create = z.object({
  body: z.object({
    fullName: z.string().min(3, 'El nombre es obligatorio'),
    dni,
    email: z.string().email('Email inválido'),
    phone: z.string().max(20).optional(),
  }),
});

const update = z.object({
  body: z.object({
    fullName: z.string().min(3).optional(),
    email: z.string().email('Email inválido').optional(),
    phone: z.string().max(20).optional(),
    dni: dni.optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/, 'ID inválido') }),
});

const byId = z.object({
  params: z.object({ id: z.string().regex(/^\d+$/, 'ID inválido') }),
});

module.exports = { create, update, byId };
