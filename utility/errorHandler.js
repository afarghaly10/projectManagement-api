require('dotenv').config();
const _ = require('lodash');
const { GenericNotFoundError } = require('./common/common');
const errorHandler = {
	log: (exception) => {
		console.error(exception);
	},
	catchNotFound: (req, res, next) => {
		const err = new GenericNotFoundError();
		return next(err);
	},
	catchAllErrors: (err, req, res, next) => {
		const env = process.env.NODE_ENV || 'local';
		const error = {
			message: err.message || null, // VALIDATON_ERROR
			status: err.status || null, // 'error' // 400
			htmlErrorCode: err.htmlErrorCode || 500,
			...(err.customProps ? err.customProps : {}),
		};

		if (env !== 'production' && err.details) {
			error.details = err.details;
		}

		if (env !== 'test') {
			// Log to the node system, no need to flood sentry.
			console.log(`${new Date().toString()} - catchAllErrors triggered:`);
			console.log(`URI: ${req.method} ${req.baseUrl}${req.path}`);
			if (req.body) {
				if (req.body.email) req.body.email = '******';
				if (req.body.password) req.body.password = '******';
			}

			if (req.headers.authorization) req.headers.authorization = '******';
			console.log(`Body: ${JSON.stringify(req.body)}`);
			console.log(`Headers: ${JSON.stringify(req.headers)}`);
			console.error(err);
		}

		if (env !== 'local' && env !== 'test' && err.htmlErrorCode !== 404) {
			// Capturing Client uuid
			const clientId = req.get('x-client-uuid');
			req.clientUuid = clientId;
			// Manual Encryption of seneitive Data
			if (req.body) {
				if (req.body.email) req.body.email = '******';
				if (req.body.password) req.body.password = '******';
			}

			if (req.headers && req.headers.authorization)
				req.headers.authorization = '******';
		}
		res.status(error.htmlErrorCode).json(error);
	},
};

module.exports = errorHandler;
