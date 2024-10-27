'use strict';
const Joi = require('joi');
const ValidationError = require('./errors/ValidationError');
/**
 * @class JoiValidatorHelper
 */
class JoiValidatorHelper {
	constructor() {
		this.validator = {};
	}
	/**
	 * @param name
	 * @param message
	 * @param schema
	 * @return {void}
	 */
	handle(name, message, schema) {
		this.validator[name] = (body) => {
			return _errorJoiHandler(body, message, schema);
		};
	}
}
/**
 * @param {*} input
 * @param {*} message
 * @param {*} schema
 */
function _errorJoiHandler(input, message, schema) {
	const {error} = schema.validate(input);
	if (error) {
		throw new ValidationError(message, error.message);
	}
}

module.exports = JoiValidatorHelper;
