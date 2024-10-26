'use strict';

class AuthenticationError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = 403;
	}
}

module.exports = AuthenticationError;
