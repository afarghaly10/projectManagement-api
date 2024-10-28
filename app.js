const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const compression = require('compression');
const helmet = require('helmet');
const errorHandler = require('./utility/errorHandler');
const passport = require('passport');
const _ = require('lodash');
require('dotenv').config();
const path = require('path');
const cors = require('cors');


// Compress all HTTP responses
app.use(compression());
// Passport JS is what we use to handle our authentication
app.use(passport.initialize());
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

app.use((req, res, next) => {
	if (process.env.DISABLE_API === 'true') {
		res.sendStatus(503);
	}
	next();
});

app.use(cors({exposedHeaders: 'Authorization', origin: '*'}));
const xmlparser = require('express-xml-bodyparser');
app.use(xmlparser());

const rawBodySaver = function(req, res, buf, encoding) {
	if (buf && buf.length) {
		req.rawBody = buf.toString(encoding || 'utf8');
	}
};
// Set json as response.
app.use(
	'/help-resource',
	bodyParser.urlencoded({limit: '3mb', extended: false})
);

app.use(bodyParser.urlencoded({extended: false, verify: rawBodySaver}));
app.use(bodyParser.json({verify: rawBodySaver}));

// Require routes.
const projectRoutes = require('./api/Project/routes');
const taskRoutes = require('./api/Project/Task/routes');
const userRoutes = require('./api/User/routes');
const teamsRoutes = require('./api/Team/routes');

// Use routes.
app.use(projectRoutes);
app.use(taskRoutes);
app.use(userRoutes);
app.use(teamsRoutes);


// catch 404 and forward to error handler
app.use(errorHandler.catchNotFound);
// error handler
app.use(errorHandler.catchAllErrors);

app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

module.exports = app;
