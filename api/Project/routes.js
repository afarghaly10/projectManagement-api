'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.route('/projects').get(controller.list).post(controller.create);
router.route('/projects/:id').get(controller.get);

module.exports = router;
