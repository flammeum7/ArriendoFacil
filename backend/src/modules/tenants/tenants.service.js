const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { ROLES, CONTRACT_STATUS } = require('../../config/constants');
const { hashPassword, generateTempPassword } = require('../../utils/password');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { writeAudit } = require('../../utils/audit');
const { sendTempPasswordEmail } = require('../../utils/mailService');

const TEMP_PASSWORD_HOURS = 72;

function serializeTenant(user) {
  const activeContract = (user.contracts || []).find(
    (c) => c.status === CONTRACT_STATUS.ACTIVE
  );
  return {
    id: user.id,
    fullName: user.fullName,
    dni: user.dni,
    email: user.email,
    phone: user.phone,
    active: user.active,
    createdAt: user.createdAt,
    assignedProperty: activeContract
      ? { id: activeContract.property.id, address: activeContract.property.address }
      : null,
  };
}

async function list(query) {
  const { page, limit, skip } = getPagination(query);
  const search = (query.search || '').trim();
  const status = query.status; // 'active' | 'inactive' | undefined

  const where = { role: ROLES.TENANT };
  if (status === 'active') where.active = true;
  if (status === 'inactive') where.active = false;
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { dni: { contains: search } },
      { email: { contains: search } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        contracts: {
          where: { status: CONTRACT_STATUS.ACTIVE },
          include: { property: true },
        },
      },
    }),
  ]);

  return { items: users.map(serializeTenant), meta: buildMeta(total, page, limit) };
}

async function getById(id) {
  const user = await prisma.user.findFirst({
    where: { id, role: ROLES.TENANT },
    include: {
      contracts: { orderBy: { createdAt: 'desc' }, include: { property: true } },
    },
  });
  if (!user) throw ApiError.notFound('Arrendatario no encontrado');
  return serializeTenant(user);
}

async function create(actorId, data) {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const tempExpires = new Date(Date.now() + TEMP_PASSWORD_HOURS * 60 * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      role: ROLES.TENANT,
      fullName: data.fullName,
      dni: data.dni,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
      mustChangePassword: true,
      tempPasswordExpiresAt: tempExpires,
      active: true,
    },
  });

  // Se envía la contraseña temporal por correo (simulado en consola por ahora)
  await sendTempPasswordEmail(user.email, tempPassword);

  await writeAudit({
    actorId,
    action: 'TENANT_CREATED',
    entity: 'User',
    entityId: user.id,
    metadata: { email: user.email, dni: user.dni },
  });

  return serializeTenant({ ...user, contracts: [] });
}

async function update(actorId, id, data) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLES.TENANT } });
  if (!existing) throw ApiError.notFound('Arrendatario no encontrado');

  const user = await prisma.user.update({
    where: { id },
    data: {
      fullName: data.fullName ?? existing.fullName,
      email: data.email ?? existing.email,
      phone: data.phone ?? existing.phone,
      dni: data.dni ?? existing.dni,
    },
    include: {
      contracts: { where: { status: CONTRACT_STATUS.ACTIVE }, include: { property: true } },
    },
  });

  await writeAudit({
    actorId,
    action: 'TENANT_UPDATED',
    entity: 'User',
    entityId: id,
    metadata: { fields: Object.keys(data) },
  });

  return serializeTenant(user);
}

async function deactivate(actorId, id) {
  const existing = await prisma.user.findFirst({ where: { id, role: ROLES.TENANT } });
  if (!existing) throw ApiError.notFound('Arrendatario no encontrado');
  if (!existing.active) throw ApiError.conflict('El arrendatario ya está inactivo');

  // Desactivación lógica: se conserva todo el historial
  await prisma.user.update({ where: { id }, data: { active: false } });

  await writeAudit({
    actorId,
    action: 'TENANT_DEACTIVATED',
    entity: 'User',
    entityId: id,
  });
  return true;
}

module.exports = { list, getById, create, update, deactivate };
