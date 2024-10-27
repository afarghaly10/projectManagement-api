'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controller_1 = require("./controller");
const router = (0, express_1.Router)();
router.route('/').get(controller_1.getProjects).post(controller_1.createProject);
exports.default = router;
