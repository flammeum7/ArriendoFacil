const { z } = require('zod');
const { PAYMENT_METHOD } = require('../../config/constants');

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

const uploadReceipt = z.object({
  body: z.object({
    method: z.nativeEnum(PAYMENT_METHOD).optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const reject = z.object({
  body: z.object({
    reason: z.string().min(3, 'Debes indicar el motivo del rechazo'),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

module.exports = { byId, uploadReceipt, reject };
