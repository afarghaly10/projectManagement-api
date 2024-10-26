const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const helmet = require('helmet');
const { AuthenticationError } = require('./utility/common/common');
const compression = require('compression');
const errorHandler = require('./utility/errorHandler');
const _ = require('lodash');
require('dotenv').config();

// Compress all HTTP responses
app.use(compression());

const passport = require('passport');
// Passport JS is what we use to handle our auth
app.use(passport.initialize());
// load passport strategies
require('./api/User/passport');

const path = require('path');
const cors = require('cors');

// Configure helmet
app.use(helmet());

const whitelist = [
	'fek.id$',
	'fekret.cloud$',
	'amazonaws.com$',
	'elasticbeanstalk.com$',
	'google.com$',
	'microsoftonline.com$',
	'auth0.com$',
	'pernodricard-onmicrosoft-com.access.mcas.ms$',
	'is3p.hallmark.com$',
];

if (!['production', 'beta'].includes(process.env.NODE_ENV)) {
	whitelist.push('localhost');
	whitelist.push('0.0.0.0');
}

// Enable CORS
app.use(express.static(path.join(__dirname, 'public')));
app.use(
	cors({
		origin: (origin, callback) => {
			// If we're on a test server or a domain is not provided
			if (process.env.NODE_ENV === 'test' || origin === undefined) {
				callback(null, true);
				return;
			}

			if (
				whitelist.some((rx) => {
					const regex = RegExp(rx);
					return regex.test(origin);
				})
			) {
				callback(null, true);
			} else {
				console.info(`Domain: ${origin} is blocked by cors`);
				console.info(whitelist);
				callback(new AuthenticationError('Domain blocked by CORS', origin));
			}
		},
	}),
	errorHandler.renderSamlError
);

app.use((req, res, next) => {
	if (process.env.DISABLE_API === 'true') {
		res.sendStatus(503);
	}
	next();
});

// app.use(cors({exposedHeaders: 'Authorization', origin: '*'}));
const xmlparser = require('express-xml-bodyparser');
app.use(xmlparser());
const rawBodySaver = function (req, res, buf, encoding) {
	if (buf && buf.length) {
		req.rawBody = buf.toString(encoding || 'utf8');
	}
};
// Set json as response.
app.use(
	'/help-resource',
	bodyParser.urlencoded({ limit: '3mb', extended: false })
);
app.use('/retool/template-tags/:modelType', bodyParser.json({ limit: '3mb' }));
app.use(
	'/retool/template-tags/manage/:tagId',
	bodyParser.json({ limit: '3mb' })
);
app.use(bodyParser.urlencoded({ extended: false, verify: rawBodySaver }));
app.use(
	'/portation/studies/:studyId/filters/validate',
	bodyParser.json({ limit: '1mb' })
);
app.use(bodyParser.json({ verify: rawBodySaver }));

// Require routes.
const adminRoutes = require('./api/Admin/routes');
const apidocRoutes = require('./api/Swagger/routes');
app.use(adminRoutes);

// Use routes.
if (!['production', 'beta'].includes(process.env.NODE_ENV)) {
	app.use('/api-docs', apidocRoutes);
}

// catch 404 and forward to error handler
app.use(errorHandler.catchNotFound);
// error handler
app.use(errorHandler.catchAllErrors);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

let currentTrace;
// Sentry.init({
// 	dsn: process.env.SENTRY_DSN,
// 	environment: process.env.NODE_ENV || 'local',
// 	beforeSend(event) {
// 		// Remove the unhelpful 'null.<anonymous>' as the last function call from stacktrace
// 		try {
// 			if (
// 				_.last(event?.exception?.values?.[0]?.stacktrace?.frames)?.function ===
// 				'null.<anonymous>'
// 			) {
// 				event?.exception?.values[0]?.stacktrace?.frames.pop();
// 			}
// 			const ddSpan = tracer.scope().active();
// 			if (ddSpan) {
// 				const parent = ddSpan.context()?._trace?.started?.[0];
// 				if (parent) parent.setTag(sentryTagForDD, event?.event_id);
// 			}
// 		} catch (e) {
// 			logger.error(e);
// 		}

// 		return event;
// 	},
// 	beforeBreadcrumb(breadcrumb, hint) {
// 		const ddSpan = tracer?.scope()?.active();
// 		currentTrace = ddSpan?.context()?.toTraceId();
// 		if (currentTrace) {
// 			breadcrumb.data = { ...breadcrumb.data, traceId: currentTrace };
// 		}
// 		return breadcrumb;
// 	},
// });

process.on('unhandledRejection', (reason, promise) => {
	if (['production', 'beta'].includes(process.env.NODE_ENV)) {
		if (reason instanceof Error) {
			reason.status = 'fatal';
			// errorHandler.logToSentry(reason);
		} else {
			const err = new Error(String(reason));
			err.status = 'fatal';
			// errorHandler.logToSentry(err);
		}
	}
});

process.on('uncaughtException', (err) => {
	if (['production', 'beta'].includes(process.env.NODE_ENV)) {
		if (err instanceof Error) {
			err.status = 'fatal';
			// errorHandler.logToSentry(err);
		} else {
			const error = new Error(String(err));
			error.status = 'fatal';
			// errorHandler.logToSentry(error);
		}
	}
});

module.exports = app;
