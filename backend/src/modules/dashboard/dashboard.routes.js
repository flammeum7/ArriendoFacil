const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../config/constants');
const controller = require('./dashboard.controller');

const router = Router();

router.use(authenticate);

router.get('/landlord', authorize(ROLES.LANDLORD), controller.landlord);
router.get('/tenant', authorize(ROLES.TENANT), controller.tenant);

module.exports = router;
