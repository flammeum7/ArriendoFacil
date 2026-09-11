const { Router } = require('express');
const prisma = require('../config/prisma');
const { success } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const authRoutes = require('../modules/auth/auth.routes');
const tenantRoutes = require('../modules/tenants/tenants.routes');
const propertyRoutes = require('../modules/properties/properties.routes');
const contractRoutes = require('../modules/contracts/contracts.routes');
const paymentRoutes = require('../modules/payments/payments.routes');
const documentRoutes = require('../modules/documents/documents.routes');
const incidentRoutes = require('../modules/incidents/incidents.routes');
const serviceRoutes = require('../modules/services/services.routes');
const notificationRoutes = require('../modules/notifications/notifications.routes');
const auditRoutes = require('../modules/audit/audit.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');
const jobRoutes = require('../modules/jobs/jobs.routes');

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    success(res, {
      message: 'API ArriendoFácil operativa',
      data: { status: 'ok', db: 'connected' },
    });
  })
);

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/properties', propertyRoutes);
router.use('/contracts', contractRoutes);
router.use('/payments', paymentRoutes);
router.use('/documents', documentRoutes);
router.use('/incidents', incidentRoutes);
router.use('/services', serviceRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/jobs', jobRoutes);

module.exports = router;
