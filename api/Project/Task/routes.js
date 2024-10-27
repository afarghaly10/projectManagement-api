'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.route('/projects/:projectId/tasks').get(controller.list).post(controller.create);

router
	.route('/projects/:projectId/tasks/:id')
	.get(controller.get)
	.patch(controller.patch)
	.delete(controller.delete);

module.exports = router;
