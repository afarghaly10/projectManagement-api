'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.route('/admin')
	.get(controller.list)
	.post(controller.create);

module.exports = router;
