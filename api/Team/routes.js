'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router
	.route('/teams')
	.get(controller.list)
	.post(controller.create);

router
	.route('/teams/:id')
	.get(controller.get)
	.patch(controller.patch)
	.delete(controller.delete);

router
	.route('/teams/:id/users')
	.post(controller.addUser);

module.exports = router;
