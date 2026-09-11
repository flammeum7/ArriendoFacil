const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../config/constants');
const controller = require('./audit.controller');

const router = Router();

// Solo el arrendador consulta la auditoría
router.use(authenticate, authorize(ROLES.LANDLORD));

router.get('/', controller.list);

module.exports = router;
