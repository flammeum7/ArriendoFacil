const prisma = require('../config/prisma');

async function writeAudit({ actorId, action, entity, entityId = null, metadata = null }) {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entity, entityId, metadata: metadata || undefined },
    });
  } catch (e) {
    console.error('[AUDIT] No se pudo registrar la acción:', e.message);
  }
}

module.exports = { writeAudit };
