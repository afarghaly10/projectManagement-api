/*
 * Use prefix _db for table definitions. Use as link in validator.
 * Use prefix dao for model validators, allowed in models, services, controllers.
 * Use no prefix for service validators, allowed in services, controllers.
 * Use prefix req for controller validators, allowed in controllers,
 * Priority of usage: daoValidator > validator(service) > reqValidator.
 */

'use strict';
const Joi = require('joi');
const JoiValidatorHelper = require('../../utility/common/joi.validator.helper');
const JoiHelper = new JoiValidatorHelper();

/**
 * @function JoiValidatorHelper#validator~createProject
 */
JoiHelper.handle(
	'createProject',
	'INVALID_INPUT',
	Joi.object({
		name: Joi.string().required(),
		description: Joi.string().optional(),
		startDate: Joi.date(),
		dueDate: Joi.date(),
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

module.exports = JoiHelper.validator;
