'use strict';
const HttpStatus = require('http-status');

class NotFoundError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = HttpStatus.NOT_FOUND;
	}
}

module.exports = NotFoundError;
