const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../config/constants');
const controller = require('./jobs.controller');

const router = Router();

router.use(authenticate, authorize(ROLES.LANDLORD));

router.post('/generate-payments', controller.generatePayments);
router.post('/mark-overdue', controller.markOverdue);
router.post('/payment-reminders', controller.paymentReminders);
router.post('/contract-alerts', controller.contractAlerts);

module.exports = router;
