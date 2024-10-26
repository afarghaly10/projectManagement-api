require('dotenv').config();

const NotFoundError = require('./errors/NotFoundError');

const errorHandler = {
	log: (exception) => {
		console.error(exception);
	},
	catchNotFound: (req, res, next) => {
		const err = new NotFoundError();
		return next(err);
	},
	catchAllErrors: (err, req, res, next) => {
		const error = {
			message: err.message || null, // VALIDATON_ERROR
			status: err.status || null, // 'error' // 400
			htmlErrorCode: err.htmlErrorCode || 500,
		};

		if (process.env.NODE_ENV !== 'production' && err.details) {
			error.details = err.details;
		}

		if (process.env.NODE_ENV !== 'test') {
			// Log to the node system, no need to flood sentry.
			console.log(`${new Date().toString()} - catchAllErrors triggered:`);
			console.log(`URI: ${req.method} ${req.baseUrl}${req.path}`);
			if (req.body.email) req.body.email = '******';
			if (req.body.password) req.body.password = '******';
			if (req.headers.authorization) req.headers.authorization = '******';
			console.log(`Body: ${JSON.stringify(req.body)}`);
			console.log(`Headers: ${JSON.stringify(req.headers)}`);
			console.error(err);
		}

		if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'local') {
			// Capturing Client uuid
			const clientId = req.get('x-client-uuid');
			req.clientUuid = clientId;
			// Manual Encryption of seneitive Data
			if (req.body.email) req.body.email = '******';
			if (req.body.password) req.body.password = '******';
			if (req.headers.authorization) req.headers.authorization = '******';

			// Add log to sentry for info
			const Sentry = require('@sentry/node');
			Sentry.init({dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'local'});
			Sentry.withScope((scope) => {
				scope.setLevel(Sentry.Severity.Debug);

				if (clientId) {
					Sentry.configureScope((scope) => {
						scope.setTag('Auth', clientId).addBreadcrumb({
							category: 'Auth',
							message: 'Authenticated user' + clientId,
							level: Sentry.Severity.Info,
						});
					});
				}
				if (clientId && clientId.length > 0) {
					Sentry.configureScope(((scope) => {
						scope.setTag('User Details', clientId).setExtra('extra', {
							'method': req.method,
							'baseUrl': req.baseUrl,
							'path': req.path,
							'username': req.params.username,
							'body': JSON.stringify(req.body),
							'headers': JSON.stringify(req.headers),
						});
					}));
				}
				Sentry.captureException(err);
			});
		}
		res.status(error.htmlErrorCode).json(error);
	},
};

module.exports = errorHandler;
