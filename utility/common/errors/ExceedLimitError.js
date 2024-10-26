'use strict';
const HttpStatus = require('http-status');

class ExceedLimitError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = HttpStatus.UNPROCESSABLE_ENTITY;
	}
}

module.exports = ExceedLimitError;
