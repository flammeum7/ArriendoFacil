const { Router } = require('express');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validate = require('../../middlewares/validate');
const { ROLES } = require('../../config/constants');
const controller = require('./properties.controller');
const schemas = require('./properties.validation');

const router = Router();

router.use(authenticate, authorize(ROLES.LANDLORD));

router.get('/', controller.list);
router.post('/', validate(schemas.create), controller.create);
router.get('/:id', validate(schemas.byId), controller.getById);
router.put('/:id', validate(schemas.update), controller.update);
router.patch('/:id/status', validate(schemas.changeStatus), controller.changeStatus);

module.exports = router;
