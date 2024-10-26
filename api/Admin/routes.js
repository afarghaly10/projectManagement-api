'use strict';

const express = require('express');
const router = express.Router();
const { auth } = require('../../utility/common/common');
const controller = require('./controller');

router.route('/admin').get(
	auth.verify,
	auth.able(['account:create']),
	// auth.adminOnly,
	controller.get
);

module.exports = router;
