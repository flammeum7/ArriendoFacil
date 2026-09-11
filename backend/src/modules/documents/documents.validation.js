const { z } = require('zod');
const { DOCUMENT_TYPE } = require('../../config/constants');

// El arrendador sube contratos, boletas u otros (los comprobantes vienen del flujo de pagos)
const uploadableTypes = z.enum([
  DOCUMENT_TYPE.CONTRACT,
  DOCUMENT_TYPE.INVOICE,
  DOCUMENT_TYPE.OTHER,
]);

const upload = z.object({
  body: z.object({
    type: uploadableTypes,
    ownerId: z.coerce.number().int().positive(),
    contractId: z.coerce.number().int().positive().optional(),
    paymentId: z.coerce.number().int().positive().optional(),
  }),
});

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

module.exports = { upload, byId };
