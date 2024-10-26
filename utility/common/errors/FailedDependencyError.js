'use strict';

class FailedDependencyError extends Error {
	constructor(props) {
		super(props);
		this.status = 'error';
		this.htmlErrorCode = 410;
	}
}

module.exports = FailedDependencyError;
