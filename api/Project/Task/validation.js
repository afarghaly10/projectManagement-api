/*
 * Use prefix _db for table definitions. Use as link in validator.
 * Use prefix dao for model validators, allowed in models, services, controllers.
 * Use no prefix for service validators, allowed in services, controllers.
 * Use prefix req for controller validators, allowed in controllers,
 * Priority of usage: daoValidator > validator(service) > reqValidator.
 */

'use strict';
const Joi = require('joi');
const JoiValidatorHelper = require('../../../utility/common/joi.validator.helper');
const JoiHelper = new JoiValidatorHelper();

/**
 * @function JoiValidatorHelper#validator~doaCreateTask
 */
JoiHelper.handle(
	'doaCreateTask',
	'INVALID_CREATE_TASK_SCHEMA',
	Joi.object({
		title: Joi.string().required(),
		description: Joi.string().optional(),
		status: Joi.string()
			.valid('To Do', 'In Progress', 'Ready For Review', 'Completed'),
		priority: Joi.string()
			.valid('Urgent', 'High', 'Medium', 'Low', 'Backlog'),
		tags: Joi.array().items(Joi.string()).optional(),
		startDate: Joi.date().optional(),
		dueDate: Joi.date().optional(),
		points: Joi.number().integer().positive().optional(),
		projectId: Joi.number().integer().positive().required(),
		authorUserId: Joi.number().integer().positive().required(),
		assignedUserId: Joi.number().integer().positive().optional(),
	})
		.unknown(false)
		.required()
);

/**
 * @function JoiValidatorHelper#validator~doaId
 */
JoiHelper.handle(
	'doaId',
	'INVALID_ID',
	Joi.number().integer().positive().required()
);

/**
 * @function JoiValidatorHelper#validator~doaPatchTask
 */
JoiHelper.handle(
	'doaPatchTask',
	'INVALID_UPDATE_TASK_SCHEMA',
	Joi.object({
		title: Joi.string().optional(),
		description: Joi.string().optional(),
		status: Joi.string()
			.valid('To Do', 'In Progress', 'Ready For Review', 'Completed'),
		priority: Joi.string()
			.valid('Urgent', 'High', 'Medium', 'Low', 'Backlog'),
		tags: Joi.array().items(Joi.string()).optional(),
		startDate: Joi.date().optional(),
		dueDate: Joi.date().optional(),
		points: Joi.number().integer().positive().optional(),
		projectId: Joi.number().integer().positive().required(),
		authorUserId: Joi.number().integer().positive().optional(),
		assignedUserId: Joi.number().integer().positive().optional(),
	})
		.unknown(false)
		.required()
);

module.exports = JoiHelper.validator;
