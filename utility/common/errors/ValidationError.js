'use strict';
const HttpStatus = require('http-status');

class ValidationError extends Error {
	constructor(props, details = null) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = HttpStatus.BAD_REQUEST;
		this.details = details;
	}
}

module.exports = ValidationError;
