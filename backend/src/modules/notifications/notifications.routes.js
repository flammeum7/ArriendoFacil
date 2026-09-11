const { Router } = require('express');
const { z } = require('zod');
const authenticate = require('../../middlewares/authenticate');
const validate = require('../../middlewares/validate');
const controller = require('./notifications.controller');

const byId = z.object({ params: z.object({ id: z.string().regex(/^\d+$/) }) });

const router = Router();

router.use(authenticate);

router.get('/', controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch('/:id/read', validate(byId), controller.markRead);

module.exports = router;
