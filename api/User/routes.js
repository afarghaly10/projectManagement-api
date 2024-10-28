'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router
	.route('/users')
	.get(controller.list);
// 	.post(controller.create);

router
	.route('/users/:id')
	.get(controller.get);


module.exports = router;
