'use strict';
const db = require('./database');
const AuthenticationError = require('./errors/AuthentiactionError');
const ValidationError = require('./errors/ValidationError');
const FailedDependencyError = require('./errors/FailedDependencyError');
const NotFoundError = require('./errors/NotFoundError');
const AuthorizationError = require('./errors/AuthorizationError');
const auth = require('../middleware/auth');
const ConflictError = require('./errors/ConflictError');
const StorageService = require('./storage');
const GenericNotFoundError = require('./errors/GenericNotFoundError');

module.exports = {
	db,
	AuthenticationError,
	ValidationError,
	FailedDependencyError,
	NotFoundError,
	AuthorizationError,
	auth,
	ConflictError,
	StorageService,
	GenericNotFoundError,
};
