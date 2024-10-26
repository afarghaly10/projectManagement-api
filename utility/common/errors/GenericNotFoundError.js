'use strict';

class GenericNotFoundError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = 400;
	}
}

module.exports = GenericNotFoundError;
