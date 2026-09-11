const { z } = require('zod');
const { INCIDENT_TYPE, INCIDENT_PRIORITY, INCIDENT_STATUS } = require('../../config/constants');

const create = z.object({
  body: z.object({
    type: z.nativeEnum(INCIDENT_TYPE),
    title: z.string().min(3, 'El título es obligatorio').max(150),
    description: z.string().min(3, 'La descripción es obligatoria').max(2000),
    priority: z.nativeEnum(INCIDENT_PRIORITY).optional(),
  }),
});

const respond = z.object({
  body: z.object({
    message: z.string().min(1, 'El mensaje es obligatorio').max(2000),
    status: z.nativeEnum(INCIDENT_STATUS).optional(),
  }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const changeStatus = z.object({
  body: z.object({ status: z.nativeEnum(INCIDENT_STATUS) }),
  params: z.object({ id: z.string().regex(/^\d+$/) }),
});

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

module.exports = { create, respond, changeStatus, byId };
