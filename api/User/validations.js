/*
 * Use prefix _db for table definitions. Use as link in validator.
 * Use prefix dao for model validators, allowed in models, services, controllers.
 * Use no prefix for service validators, allowed in services, controllers.
 * Use prefix req for controller validators, allowed in controllers,
 * Priority of usage: daoValidator > validator(service) > reqValidator.
*/

'use strict';
const Joi = require('joi');
const JoiValidatorHelper = require('../../utility/joi.validator.helper');
const JoiHelper = new JoiValidatorHelper();

// Properties
const _db = {
	email: Joi.string().email(),
	samlUuid: Joi.string().required(),
	samlUserConfig: Joi.string().required(),
	samlPath: Joi.string().required(),
	samlIssuer: Joi.string().required(),
	samlCertPath: Joi.string().allow('', null),
	samlRoleId: Joi.number().allow('', null),
	samlEntryPoint: Joi.string().required(),
};

/**
 * @function JoiValidatorHelper#validator~daoEmailValidation
 */
JoiHelper.handle('daoEmailValidation', 'INVALID_EMAIL_ADDRESS',
	Joi.object({
		email: _db.email.required(),
	}).unknown(false).required(),
);


/**
 * @function JoiValidatorHelper#validator~daoSamlSettings
 */
JoiHelper.handle('daoSamlSettings', 'INVALID_SAML_CONFIG',
	Joi.object({
		samlUuid: _db.samlUuid,
		samlUserConfig: _db.samlUserConfig,
		samlPath: _db.samlPath,
		samlIssuer: _db.samlIssuer,
		samlCertPath: _db.samlCertPath,
		samlEntryPoint: _db.samlEntryPoint,
	}).unknown(true).required(),
);

/**
 * @function JoiValidatorHelper#validator~createUser
 */
JoiHelper.handle('createUser', 'INVALID_INPUT',
	Joi.object({
		invitationToken: Joi.string().required(),
		email: Joi.string().required(),
		password: Joi.string().required(),
		marketingMail: Joi.boolean(),
		termsConditions: Joi.boolean(),
		utmSource: Joi.string(),
		utmMedium: Joi.string(),
		utmCampaign: Joi.string(),
		utmTerm: Joi.string(),
		utmContent: Joi.string(),
	})
);

module.exports = JoiHelper.validator;

/**
 * @function JoiValidatorHelper#validator~editUserSettings
 */
JoiHelper.handle('editUserSettings', 'INVALID_INPUT',
	Joi.array().items(Joi.object({
		label: Joi.string().valid('market-simulator-product-tour-viewed').required(),
		type: Joi.string().required(),
		value: Joi.string().required(),
	}))
);

module.exports = JoiHelper.validator;
