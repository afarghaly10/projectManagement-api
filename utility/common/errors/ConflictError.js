'use strict';

class ConflictError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = 409;
	}
}

module.exports = ConflictError;
