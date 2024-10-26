'use strict';

class AuthenticationError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = 401;
	}
}

module.exports = AuthenticationError;
