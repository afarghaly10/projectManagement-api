'use strict';
const httpStatus = require('http-status');
const Joi = require('joi');
const accessKey = require('./../AccessKey/model');
const {db, AuthenticationError, AuthorizationError, NotFoundError, ValidationError} = require('../../utility/common/common');
const sendGrid = require('../../utility/messaging/sendgrid');
const AccessKey = require('../AccessKey/model');
const templateService = require('../Template/template.service');
const ModelAccess = require('../ModelAccess/service');
const user = require('./user');
const axios = require('axios');
const applicationId = process.env.applicationId || '1';
const applicationKeyHeaders = {
	'x-application-key': process.env.APPLICATION_KEY || '',
	'x-application-secret': process.env.APPLICATION_SECRET || '',
};

const {v4: uuidV4} = require('uuid');
const jwt = require('jsonwebtoken');
const userService = require('./service');
const ZENDESK_JWT_SECRET = process.env.ZENDESK_JWT_SECRET;
const CANNY_SECRET_KEY = process.env.CANNY_SECRET_KEY;
const validator = require('./validations');
const activityLog = require('../Study/StudyAuditLog/service');
const adminService = require('../Admin/service');
// const errorHandler = require('../../utility/errorHandler');

const accountsService = require('../Account/service');
const accountSettingsService = require('../Account/account-settings');
const accountSubscriptionService = require('../AccountSubscription/service');
const subscriptionService = require('../Subscription/service');


const ChargifyClass = require('../../utility/billing/chargify/provider');

const HubspotService = require('../../utility/hubspot/provider');
const SlackService = require('../../utility/messaging/slack');
const AccountService = require('../Account/service');

exports.hubspot = new HubspotService();


exports.login = async (req, res, next) => {
	try {
		const loginResponse = await user.login(req.body);
		if (loginResponse) {
			const token = loginResponse.token;
			res.set('Authorization', `Bearer ${token}`).json(
				{
					token,
					limboState: loginResponse?.limboState || 'none',
				});
		} else {
			throw new AuthorizationError('Unable to login', 'UNAUTHENTICATED');
		}
	} catch (e) {
		next(e);
	}
};

exports.loginAsUser = async (req, res, next) => {
	try {
		const token = await user.loginAsUser(req.body, req.authJwt);
		res.json({token});
	} catch (e) {
		console.log('error loginAsUser :', e);
		next(e);
	}
};

module.exports.logoutAll = async (req, res, next) => {
	try {
		const token = req.authJwt;
		await user.logoutAll(token);
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.logout = async (req, res, next) => {
	try {
		const token = req.authJwt;
		await user.logout(token);
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.logoutUsersByUuid = async (req, res, next) => {
	try {
		if (req.body.userUuids && req.body.userUuids.length > 0) {
			await AccessKey.removeAllByUuids(req.body.userUuids);
		}
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.forceRefreshToken = async (req, res, next) => {
	try {
		if (req.body.userUuids && req.body.userUuids.length > 0) {
			await AccessKey.forceRefreshByUuids(req.body.userUuids);
		}
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.verify = async (req, res, next) => {
	try {
		const token = req.headers.authorization.replace('Bearer ', '');
		const fullToken = req.authorization;

		res.set('Authorization', `Bearer ${token}`).json({fullToken, token});
	} catch (e) {
		next(e);
	}
};

module.exports.getCannySSOToken = async (req, res, next) => {
	try {
		const user = await userService.getUser(req.authJwt, req.user.uuid);
		res.set('Authorization', `Bearer ${req.authJwt}`).json({
			token: jwt.sign({
				email: user.email,
				id: user.uuid,
				name: user.name,
			}, CANNY_SECRET_KEY, {algorithm: 'HS256'}),
		});
	} catch (e) {
		next(e);
	}
};

module.exports.verifyZendesk = async (req, res, next) => {
	try {
		const user = await userService.getUser(req.authJwt, req.user.uuid);
		const zendeskToken = jwt.sign({
			jti: uuidV4(),
			email: user.email,
			name: user.name,
		}, ZENDESK_JWT_SECRET, {
			expiresIn: '2d',
		});

		// TODO: Add check to see if the token needs to be refresh and update if applicable
		res.set('Authorization', `Bearer ${req.authJwt}`).json({token: zendeskToken});
	} catch (e) {
		next(e);
	}
};
module.exports.microsoftCallback = async (req, res, next) => {
	try {
		const data = req.user;


		const oldJwt = data.token;
		const body = AccessKey.decodeJwt(oldJwt);
		const token = data.minifiedKey;

		// Gen new token based off of the full token for accounts
		const newJwt = await user.checkPrivilege(body, data.minifiedKey, true);

		/**
		 * We need to generate a new key that strips out all of the users clients.
		 * Currently, the jwt is having an overflow issue with cookies
		 */

		const rawAccessKey = {
			userUuid: newJwt.newTokenBody.user.uuid,
			key: newJwt.minifiedToken,
			userData: newJwt.fullToken,
			authJwt: token,
			accountUuid: newJwt.accountUuid,
		};

		await AccessKey.create(rawAccessKey);

		// const keepAlive = jwt.keepAlive || false;
		// const cookieExpiry = keepAlive ? 1000 * 60 * 60 * 24 * 7 : 1000 * 60 * 60 * 3;
		const options = {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			domain: '.upsiide.com',
			httpOnly: false,
			secure: process.env.NODE_ENV !== 'local',
		};

		const cookieName = process.env.AUTH_COOKIE_NAME || 'UPSIIDE_USER_TOKEN';
		await res.cookie(cookieName, newJwt.minifiedToken, options);
		res.set('Authorization', `Bearer ${newJwt.minifiedToken}`);
		res.redirect(process.env.MICROSOFT_SSO_REDIRECT);
	} catch (e) {
		next(e);
	}
};
module.exports.getUserClients = async (req, res, next) => {
	try {
		let currentUserUuid = req.user.uuid;
		if (currentUserUuid.indexOf('user') !== -1) currentUserUuid = currentUserUuid.replace('user:', '');

		let requestedUserUuid = req.params.userUuid;
		if (requestedUserUuid.indexOf('user') !== -1) requestedUserUuid = requestedUserUuid.replace('user:', '');

		const result = await user.getUserClients(currentUserUuid, requestedUserUuid, req.authJwt);
		res.json(result);
	} catch (e) {
		console.error(e);
		next(e);
	}
};

module.exports.
	inviteUser = async (req, res, next) => {
		try {
			const clientUuid = req.clientUuid; // client:xxxx-xx...
			const token = req.authJwt;

			const result = await axios.post(`${process.env.AUTH_URL}/public/users`, {
				applicationId,
				clientUuid: clientUuid,
				email: req.body.email,
				roleId: req.body.roleId,
				confirmData: {},
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
					...applicationKeyHeaders,
				},
			});


			let isExistingAccount = false;

			if (result && result.data && result.data.isExistingAccount !== undefined) {
				isExistingAccount = result.data.isExistingAccount;
			}

			if (isExistingAccount == false) {
				const details = await axios.post(`${process.env.AUTH_URL}/public/users/trial`,
					{
						roleId: process.env.TRIAL_VIEWER_ROLE_ID,
						clientUuid: process.env.TRIAL_SPACE_UUID,
						sendEmail: false,
						email: req.body.email,
						// applicationId, - not only dig employee can add user to client
					},
					{
						headers: {
							...applicationKeyHeaders,
						},
					}
				);
				console.log('details.data :', details.data);
			}
			res.sendStatus(httpStatus.NO_CONTENT);
		} catch (e) {
			next(e);
		}
	};

module.exports.getUser = async (req, res, next) => {
	try {
		const token = req.authJwt;
		let currentUserUuid = req.user.uuid;
		if (currentUserUuid.indexOf('user') !== -1) currentUserUuid = currentUserUuid.replace('user:', '');
		const response = await axios.get(`${process.env.AUTH_URL}/public/users/${currentUserUuid}`, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		});
		const userData = response.data;
		userData.settings = await user.getUserSettings(userData.uuid);
		res.json(userData);
	} catch (e) {
		next(e);
	}
};

module.exports.getUsers = async (req, res, next) => {
	try {
		const token = req.authJwt;
		const {emailFilter, limit, offset} = req.query;
		const users = [];
		if (req.clientIds.length > 0) {
			const result = await axios.post(process.env.AUTH_URL + '/public/users-by-clients', {
				clientUuids: req.clientIds,
				search: emailFilter,
				limit,
				offset,
			}, {
				headers: {
					Authorization: `Bearer ${token}`,
					...applicationKeyHeaders,
				},
			}).catch((e) => {
				console.error(e);
				throw new AuthorizationError(e.response.data.message);
			});

			const unfilteredUsers = result.data || [];

			const currentUserJwt = req.authorization;
			const decodedJwt = AccessKey.decodeJwt(currentUserJwt);

			for (const unfilteredUser of unfilteredUsers) {
				for (const client of unfilteredUser.clients) {
					const scopedClient = decodedJwt.privileges.find((item) => {
						if (item.uuid == client.uuid) {
							return item;
						}
					});

					if (scopedClient != undefined && scopedClient.roleLevel >= client.roleLevel) {
						const existingUser = users.find((item) => {
							if (item.uuid == unfilteredUser.uuid) {
								return item;
							}
						});

						if (existingUser == undefined) {
							users.push(unfilteredUser);
						}
					}
				}
			}
		}

		res.json(users);
	} catch (e) {
		throw e;
	}
};

module.exports.updateUser = async (req, res, next) => {
	try {
		const token = req.authJwt;
		let currentUserUuid = req.user.uuid;
		if (currentUserUuid.indexOf('user') !== -1) currentUserUuid = currentUserUuid.replace('user:', '');
		await axios.patch(`${process.env.AUTH_URL}/public/users/${currentUserUuid}`,
			{
				...(req.body.username ? {username: req.body.username} : null),
				...(req.body.firstName ? {firstName: req.body.firstName} : null),
				...(req.body.lastName ? {lastName: req.body.lastName} : null),
				...(req.body.password ? {password: req.body.password} : null),
				applicationId,
			},
			{
				headers: {
					Authorization: `Bearer ${token}`,
					...applicationKeyHeaders,
				},
			}
		)
			.then((res) => {
				sendGrid.send({
					email: res.data.email,
					name: req.body.firstName || req.body.email,
				},
				'verify-password-reset',
				{
				});
			})
			.catch((e) => {
				const errorMsg =
					e.response && e.response.data && e.response.data.message ?
						e.response.data.message :
						'INVALID_TOKEN';

				if (errorMsg == 'PASSPORT_POLICY_FAILED') {
					throw new ValidationError(errorMsg);
				} else {
					throw new AuthenticationError(errorMsg);
				}
			});
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.resetPassword = async (req, res, next) => {
	try {
		await axios
			.post(`${process.env.AUTH_URL}/public/password/reset`,
				{
					applicationId,
					email: req.body.email,
				},
				{
					headers: {
						...applicationKeyHeaders,
					},
				}
			)
			.then((res) => {
				if (req?.body?.email && res?.data?.resetPasswordUrl) {
					sendGrid.send(
						{email: req.body.email},
						'reset-password',
						{
							resetPasswordUrl: res.data.resetPasswordUrl,
						}
					);
				}
			})
			.catch((e) => {
				const errorMsg =
					e.response && e.response.data && e.response.data.message ?
						e.response.data.message :
						'USER_NOT_FOUND';

				throw new NotFoundError(errorMsg);
			});
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.changePasswordByResetToken = async (req, res, next) => {
	try {
		if (req.body.password !== req.body.confirmPassword) {
			throw new Error('PASSWORDS_DO_NOT_MATCH');
		}
		await axios.post(`${process.env.AUTH_URL}/public/change-password`, {
			resetToken: req.body.token,
			password: req.body.password,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		})
			.catch((e) => {
				// If we get an error here it will be either because the password failed validation or server error.
				throw new ValidationError('PASSPORT_POLICY_FAILED');
			});

		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.checkResetPasswordToken = async (req, res, next) => {
	try {
		const response = await axios.post(`${process.env.AUTH_URL}/public/check-reset-token`, {
			resetToken: req.body.token,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		});
		if (!response.data.email) {
			throw new Error('INVALID_TOKEN');
		}
		res.json({
			email: response.data.email,
		});
	} catch (e) {
		next(e);
	}
};

module.exports.checkInvitationToken = async (req, res, next) => {
	try {
		const response = await axios.post(`${process.env.AUTH_URL}/public/invitation/check-token`, {
			invitationToken: req.body.invitationToken,
			applicationId,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		})
			.catch((e) => {
				throw new ValidationError('INVALID_TOKEN');
			});
		if (response?.data?.shareId) {
			res.json({
				shareId: response.data.shareId,
			});
		}
	} catch (e) {
		next(e);
	}
};

module.exports.checkEmailToken = async (req, res, next) => {
	try {
		const response = await axios.post(`${process.env.AUTH_URL}/public/invitation/check-token`, {
			invitationToken: req.body.invitationToken,
			applicationId,
			completeInvitation: true,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		})
			.catch((e) => {
				throw new ValidationError('INVALID_TOKEN');
			});
		if (response?.data?.shareId) {
			res.json({
				shareId: response.data.shareId,
			});
		}
	} catch (e) {
		next(e);
	}
};

module.exports.resendInvitation = async (req, res, next) => {
	try {
		const clientUuid = req.clientUuid;
		const token = req.authJwt;
		const {accountName} = req.body;

		await axios.post(`${process.env.AUTH_URL}/public/users/resendInvitation`, {
			clientUuid: clientUuid,
			email: req.body.email,
			applicationId,
		}, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		}).then((res) => {
			sendGrid.send(
				{
					email: req.body.email,
				},
				'new-user-invite',
				{
					actionURL: res.data?.actionURL,
					accountName: accountName || res.data?.invitationName,
				}
			);
		})
			.catch((e) => {
				throw new ValidationError('INVALID_INVITATION_RESEND_RESPONSE');
			});
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.resendEmailValidation = async (req, res, next) => {
	try {
		const clientUuid = req.clientUuid;
		const token = req.authJwt;

		await axios.post(`${process.env.AUTH_URL}/public/users/resendEmailValidation`, {
			clientUuid: clientUuid,
			email: req.body.email,
			applicationId,
		}, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		}).then((res) => {
			// sends the verification email
			sendGrid.send(
				{
					email: req?.body?.email || '',
				},
				'verify-email',
				{
					actionURL: res.data?.actionURL,
				});
		})
			.catch((e) => {
				throw new ValidationError('INVALID_EMAIL_VALIDATION_RESEND_RESPONSE');
			});
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

module.exports.createByInvite = async (req, res, next) => {
	try {
		// Build our body to send to api
		// @TODO password schema validation
		await validator.createUser(req.body);
		const {
			password,
			username,
			invitationToken,
			email,
			marketingMail,
		} = req.body;

		if (invitationToken == null) throw new ValidationError('MISSING_INVITATION_TOKEN');

		const body = {
			password,
			username: username || '',
			applicationId,
			invitationToken,
		};

		const response = await axios.post(`${process.env.AUTH_URL}/public/users/invite`, body, {
			headers: {
				...applicationKeyHeaders,
			},
		}).catch((e) => {
			const errorMsg =
				e.response && e.response.data && e.response.data.message ? e.response.data.message : 'INVALID_TOKEN';

			if (errorMsg == 'PASSPORT_POLICY_FAILED') {
				throw new ValidationError(errorMsg);
			} else {
				throw new AuthenticationError(errorMsg);
			}
		});

		const oldJwt = response && response.data ? response.data.token : '';

		let token = undefined;

		if (oldJwt) {
			// Gen new key
			const body = AccessKey.decodeJwt(oldJwt);


			// Gen new token based off of the full token for accounts
			const newJwt = await user.checkPrivilege(body, response.data.minifiedKey);

			/**
			 * We need to generate a new key that strips out all of the users clients.
			 * Currently, the jwt is having an overflow issue with cookies
			 */

			token = newJwt.minifiedToken;

			const rawAccessKey = {
				userUuid: newJwt.newTokenBody.user.uuid,
				key: newJwt.minifiedToken,
				userData: newJwt.fullToken,
				authJwt: response.data.minifiedKey,
				accountUuid: newJwt.accountUuid,
			};

			await accessKey.create(rawAccessKey);

			await createUserSettings({
				userUuid: newJwt.newTokenBody.user.uuid,
				ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				email,
			});

			if (email) {
				// create hubspot contact as a basic lead
				await this.hubspot.createContact(email);
				if (marketingMail) {
					await this.hubspot.patchContact(
						{
							email,
						},
						true,
						this.hubspot.MAIL_LISTS.MARKETING_LIST
					);
				} else {
					await this.hubspot.patchContact(
						{
							email,
						},
						true, // add it to customer list
						this.hubspot.MAIL_LISTS.CUSTOMER_LIST
					);
				}
			}
		}

		res.set('Authorization', `Bearer ${token}`).json({token});
	} catch (e) {
		next(e);
	}
};

const createUserSettings = async (data) => {
	const [setting] = await adminService.getAppSetting('tc-version');
	if (!setting?.value) {
		console.error('tc-version is not set in AppSettings table!');
	}

	const userSettings = [{
		userUuid: data.userUuid,
		label: 'tc-version',
		type: 'number',
		value: setting?.value || '',
		createdAt: db.expr.now(),
		updatedAt: db.expr.now(),
	},
	{
		userUuid: data.userUuid,
		label: 'sign-up-ip-address',
		type: 'string',
		value: data.ipAddress,
		createdAt: db.expr.now(),
		updatedAt: db.expr.now(),
	}];

	await user.bulkCreateUserSetting(userSettings);
};

module.exports.removeClientUser = async (req, res, next) => {
	try {
		const {error} = Joi.object({
			clientUuids: Joi.array().items(Joi.string().required()).required(),
			userUuid: Joi.string().required(),
		}).validate(req.body);
		if (error) {
			throw new ValidationError('INVALID_PARAMS');
		}
		const clientUuids = req.body.clientUuids;
		const userUuid = req.body.userUuid;
		await ModelAccess.removeUserClient(userUuid, clientUuids);
		await user.bulkDelete(userUuid, clientUuids, req.authJwt);
		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		console.log(e);
		next(e);
	}
};

module.exports.trialSignup = async (req, res, next) => {
	try {
		const {error} = Joi.object({
			email: Joi.string().email().required(),
			sourceUrl: Joi.string().allow('', null).optional(),
		}).validate(req.body);

		if (error) {
			throw new ValidationError('INVALID_INPUT');
		}

		const settings = await user.isEmailSaml(req.body.email);
		if (settings) {
			await validator.daoSamlSettings(settings);
			const API_URL = process.env.SSO_API_URL || 'https://sso.upsiide.com';
			const redirectUrl = `${API_URL}/auth/saml/${settings.samlUuid}/login`;

			res.json({redirectUrl});
		} else {
			await axios.post(`${process.env.AUTH_URL}/public/users/trial`, {
				...req.body,
				roleId: process.env.TRIAL_ROLE_ID,
				clientUuid: process.env.TRIAL_SPACE_UUID,
			}, {
				headers: {
					...applicationKeyHeaders,
				},
			}).then((res) => {
				if (res) {
					sendGrid.send({
						email: req?.body?.email || '',
					},
					'new-user-invite',
					{
						actionURL: res.data?.actionURL,
						accountName: 'Upsiide General Resources',
					});
				}
			})
				.catch((e) => {
					const errorMsg =
						e.response &&
							e.response.data &&
							e.response.data.message ? e.response.data.message : 'INVALID_AUTH_RESPONSE';

					throw new ValidationError(errorMsg);
				});
			res.sendStatus(httpStatus.OK);
		}
	} catch (e) {
		next(e);
	}
};

module.exports.completeTrialSignup = async (req, res, next) => {
	try {
		await validator.createUser(req.body);

		const response = await axios.patch(`${process.env.AUTH_URL}/public/users/trial`, req.body, {
			headers: {
				...applicationKeyHeaders,
			},
		}).catch((e) => {
			const errorMsg =
				e.response && e.response.data && e.response.data.message ? e.response.data.message : 'INVALID_TOKEN';

			throw new ValidationError(errorMsg);
		});

		const oldJwt = response && response.data ? response.data.token : '';

		let token = undefined;

		if (oldJwt) {
			// Gen new key
			const body = AccessKey.decodeJwt(oldJwt);


			// Gen new token based off of the full token for accounts
			const newJwt = await user.checkPrivilege(body, response.data.minifiedKey);

			/**
			 * We need to generate a new key that strips out all of the users clients.
			 * Currently, the jwt is having an overflow issue with cookies
			 */

			token = newJwt.minifiedToken;

			const rawAccessKey = {
				userUuid: newJwt.newTokenBody.user.uuid,
				key: newJwt.minifiedToken,
				userData: newJwt.fullToken,
				authJwt: response.data.minifiedKey,
				accountUuid: newJwt.accountUuid,
			};

			await accessKey.create(rawAccessKey);

			await createUserSettings({
				userUuid: newJwt.newTokenBody.user.uuid,
				ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
				email: req.body.email,
			});
			if (req?.body?.email) {
				// create hubspot contact as a basic lead
				const {utmSource,
					utmMedium,
					utmCampaign,
					utmTerm,
					utmContent} = req?.body || {};
				await Promise.all([
					this.hubspot.createContact(req?.body?.email),
					this.hubspot.patchContact(
						{
							email: req?.body?.email,
							utm_source: utmSource ?? null,
							utm_medium: utmMedium ?? null,
							utm_campaign: utmCampaign ?? null,
							utm_term: utmTerm ?? null,
							utm_content: utmContent ?? null,
						},
						true, // add it to customer list
						this.hubspot.MAIL_LISTS.CUSTOMER_LIST
					)]);
			}
		}

		res.set('Authorization', `Bearer ${token}`).json({token});
	} catch (e) {
		next(e);
	}
};

module.exports.selfSignUp = async (req, res, next) => {
	try {
		const {
			email,
			password,
		} = req?.body || {};
		const {error} = Joi.object({
			email: Joi.string().email().required(),
			password: Joi.string().required(),
			marketingMail: Joi.boolean().optional(),
			sourceUrl: Joi.string().allow('', null).optional(),
			utmMedium: Joi.string().allow('', null).optional(),
			utmSource: Joi.string().allow('', null).optional(),
			utmCampaign: Joi.string().allow('', null).optional(),
			utmTerm: Joi.string().allow('', null).optional(),
			utmContent: Joi.string().allow('', null).optional(),
		}).validate(req.body);
		if (error) {
			throw new ValidationError('INVALID_INPUT');
		}

		await validator.createUser({email, password, invitationToken: '-'});

		const settings = await user.isEmailSaml(req?.body?.email);

		if (settings) {
			await validator.daoSamlSettings(settings);
			const API_URL = process.env.SSO_API_URL || 'https://sso.upsiide.com';
			const redirectUrl = `${API_URL}/auth/saml/${settings.samlUuid}/login`;

			res.json({redirectUrl});
		} else {
			const response = await axios.post(`${process.env.AUTH_URL}/public/users/sign-up`, {
				...req.body,
			}, {
				headers: {
					...applicationKeyHeaders,
				},
			}).catch((e) => {
				const errorMsg =
					e.response &&
						e.response.data &&
						e.response.data.message ? e.response.data.message : 'INVALID_AUTH_RESPONSE';

				throw new ValidationError(errorMsg);
			});

			if (response) {
				// sends the verification email
				sendGrid.send(
					{
						email: req?.body?.email || '',
					},
					'verify-email',
					{
						actionURL: response.data?.actionURL,
					});

				// create hubspot contact as either a mql or non-mql
				if (req?.body?.email) {
					const {utmSource,
						utmMedium,
						utmCampaign,
						utmTerm,
						utmContent} = req?.body || {};
					await this.hubspot.createContact(req?.body?.email);
					await this.hubspot.patchContact(
						{
							email: req?.body?.email,
							utm_source: utmSource ?? null,
							utm_medium: utmMedium ?? null,
							utm_campaign: utmCampaign ?? null,
							utm_term: utmTerm ?? null,
							utm_content: utmContent ?? null,
						},
						true, // should be added on the mail list?
						this.hubspot.MAIL_LISTS.HUBSPOT_SSU_EMAIL_IS_KNOWN
					);
					await this.hubspot.patchContact(
						{
							email: req?.body?.email,
						},
						true, // should be added on the mail list?
						this.hubspot.MAIL_LISTS.HUBSPOT_SSU_ABANDONED_CART
					);
					// adds user to either MQL or NON-MQL lists
					await this.hubspot.patchContact(
						{
							email: req?.body?.email,
						},
						true, // should be added on the mail list?
						req?.body?.marketingMail ?
							this.hubspot.MAIL_LISTS.HUBSPOT_SSU_MQL_LIST :
							this.hubspot.MAIL_LISTS?.HUBSPOT_SSU_NON_MQL_LIST
					);
				}
			}

			res.sendStatus(httpStatus.OK);
		}
	} catch (e) {
		next(e);
	}
};

module.exports.completeSelfSignUp = async (req, res, next) => {
	try {
		// avoid relay billing information to auth api
		const {
			email,
			firstName,
			lastName,
			howDidYouHear,
			accountName,
		} = req.body;

		const billingProvider = new ChargifyClass();

		const chargifySubscriptionData = (await billingProvider.createSubscription(
			{
				product_handle: 'professional',
				product_price_point_handle:
					process?.env?.CHARGIFY_NON_OBLIGATION_YEARLY_TRIAL_HANDLE,
				customer_attributes: {
					'first_name': firstName,
					'last_name': lastName,
					email,
					'organization': accountName,
				},
				payment_collection_method: 'automatic',
				currency: 'USD',
			}
		))?.subscription;


		const authResponse = await axios.patch(`${process.env.AUTH_URL}/public/users/sign-up`, {
			email,
			firstName,
			lastName,
			organization: accountName,
			roleId: process.env.ACC_ADMIN_ROLE_ID,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		}).catch((e) => {
			const errorMsg = e.response?.data?.message || 'INVALID_TOKEN';

			throw new ValidationError(errorMsg);
		});

		// patch hubspot contact with the latest info
		if (email) {
			const hubSpotContact = await this.hubspot.getContact(email, ['email',
				'how_did_you_hear_about_us_', 'firstname', 'lastname', 'company']);
			await this.hubspot.patchContact(
				{
					email,
					firstname: this.hubspot.getContactPropertyOrRewiteWithValue(hubSpotContact, 'firstname', firstName),
					lastname: this.hubspot.getContactPropertyOrRewiteWithValue(hubSpotContact, 'lastname', lastName),
					company: this.hubspot.getContactPropertyOrRewiteWithValue(hubSpotContact, 'company', accountName),
					how_did_you_hear_about_us_: this.hubspot.getContactPropertyOrRewiteWithValue(
						hubSpotContact,
						'how_did_you_hear_about_us_',
						howDidYouHear
					),
				},
				false, // should be added on the marketing mail list?
			);
			await this.hubspot.removeContactFromMailList(email, this.hubspot.MAIL_LISTS.HUBSPOT_SSU_ABANDONED_CART);
		}

		// we should return the auth token here?
		if (authResponse) {
			const oldJwt = authResponse?.data?.token;

			const {client} = authResponse.data;

			let token = undefined;

			if (oldJwt) {
				// Gen new key
				const body = AccessKey.decodeJwt(oldJwt);

				// Gen new token based off of the full token for accounts
				const newJwt = await user.checkPrivilege(body, authResponse?.data?.minifiedKey);

				/**
				 * We need to generate a new key that strips out all of the users clients.
				 * Currently, the jwt is having an overflow issue with cookies
				 */

				token = newJwt.minifiedToken;

				const rawAccessKey = {
					userUuid: newJwt?.newTokenBody?.user?.uuid,
					key: newJwt?.minifiedToken,
					userData: newJwt?.fullToken,
					authJwt: authResponse?.data?.minifiedKey,
					accountUuid: newJwt?.accountUuid,
				};

				await accessKey.create(rawAccessKey);

				await createUserSettings({
					userUuid: newJwt.newTokenBody.user.uuid,
					ipAddress: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
					email: req?.body?.email,
				});

				// create account here
				const newacc = await accountsService.create({
					chargifyCustomerId: String(chargifySubscriptionData?.customer?.id),
					verified: true,
					type: 'saas',
					ownerUuid: client.uuid,
				});

				const accountSettings = {
					billingEmail: email,
					spaceLimit: 1, // professional plan users can only have 1 space
					userLimit: 3,
					businessName: accountName,
					isTrial: false,
					isBillable: true,
					isAccountDisabled: false,
					currency: 'USD',
				};
				await accountsService.createAccountSettings(newacc.id, accountSettings);

				// create account client connection
				accountsService.addClientToAccount(newacc.id, client.uuid);

				// this allows the account to create BYO audiences
				await templateService.addByoTemplateToAccount(newacc.uuid, accountSettings);

				// create account subscription without chargify data
				const selectedSubscription = (await subscriptionService.listSubscriptions()).find((sub) => {
					return sub.chargifyId === chargifySubscriptionData.product.product_price_point_handle;
				});

				await accountSubscriptionService.createAccountSubscription(
					{
						accountId: newacc.id,
						subscriptionId: selectedSubscription?.id,
						state: chargifySubscriptionData?.state,
					}
				);

				// patch account settings to provision AMP subscription
				await accountSettingsService.patchProvisioningState(
					newacc.id,
					{'Usage Subscription': 'provisioning'}
				);

				// Send slack notification to customer success channel
				await SlackService.sendProfessionalSelfSignupMessage(accountName);

				res.set('Authorization', `Bearer ${token}`).json({accountUuid: newacc?.uuid, token});
			}
		}
	} catch (e) {
		next(e);
	}
};

module.exports.previewSubscription = async (req, res, next) => {
	try {
		// avoid relay billing information to auth api
		const {
			email,
			productHandle,
			planFrequency,
			chargifyToken,
		} = req.body;

		const chargify = new ChargifyClass();

		const mainSubscription = {
			customer_attributes: {
				email,
			},
			payment_profile_attributes: {
				payment_type: 'credit_card',
			},
			product_handle: productHandle,
			product_price_point_handle: planFrequency,
		};

		// eslint-disable-next-line
		const chargifySubscriptionData = await chargify.previewSubscription(mainSubscription, chargifyToken);


		res.json(chargifySubscriptionData);
	} catch (e) {
		next(e);
	}
};

module.exports.previewSubscriptionWithCardOnFile = async (req, res, next) => {
	try {
		const {
			productHandle,
			pricePointHandle,
		} = req.params;

		const accountUuid = req.headers['x-account-uuid'];
		const account = await accountsService.getByUuid(accountUuid);
		const accountCreditCards = await AccountService.getAccountCreditCards(account.id);
		const defaultCreditCard = accountCreditCards.find((card) => card.isDefault);

		const chargify = new ChargifyClass();

		const mainSubscription = {
			product_handle: productHandle,
			product_price_point_handle: pricePointHandle,
			payment_profile_attributes: {
				billing_address: defaultCreditCard?.address,
				billing_city: defaultCreditCard?.city,
				billing_state: defaultCreditCard?.state,
				billing_country: defaultCreditCard?.country,
				billing_zip: defaultCreditCard?.zip,
			},
		};

		// eslint-disable-next-line
		const previewSubscriptionResponse = await chargify.previewSubscriptionWithCardOnFile(mainSubscription);


		res.json(previewSubscriptionResponse);
	} catch (e) {
		next(e);
	}
};

module.exports.samlCallback = async (req, res, next) => {
	try {
		const data = req.user;

		const oldJwt = data.token;
		const body = AccessKey.decodeJwt(oldJwt);
		const token = data.minifiedKey;

		const newJwt = await user.checkPrivilege(body, data.minifiedKey, true);
		let accountUuid = null;
		if (req.params && req.params.samlUuid) {
			const query = db
				.select()
				.fields(
					'A.uuid'
				)
				.from('AccountSettings', 'ACS')
				.join('Accounts', 'A')
				.on('ACS.accountId=A.id')
				.where({
					'ACS.samlUuid': req.params.samlUuid,
				});

			const [settings] = await db.run(query);
			if (settings) accountUuid = settings.uuid;
		}

		if (accountUuid) {
			if (data.isNewUser) {
				await activityLog.create('USER', body.user.uuid.replace('user:', ''), null,
					'USER_CREATED', null, {uuid: body.user.uuid}, false, accountUuid);
				await activityLog.create('USER', body.user.uuid.replace('user:', ''), null,
					'ADDED_TO_SPACE', body.privileges.map((i) => {
						return {space: i.uuid.replace('client:', '')};
					}), {uuid: body.user.uuid}, false, accountUuid);
			}

			await activityLog.create('USER', body.user.uuid.replace('user:', ''), null,
				'SIGNED_IN', null, {uuid: body.user.uuid}, false, accountUuid);
		}

		const rawAccessKey = {
			userUuid: newJwt.newTokenBody.user.uuid,
			key: newJwt.minifiedToken,
			userData: newJwt.fullToken,
			authJwt: token,
			accountUuid,
		};

		await AccessKey.create(rawAccessKey);

		const options = {
			maxAge: 1000 * 60 * 60 * 24 * 7,
			domain: process.env.AUTH_COOKIE_DOMAIN || '.upsiide.com',
			httpOnly: false,
			secure: process.env.NODE_ENV !== 'local',
		};

		const cookieName = process.env.AUTH_COOKIE_NAME || 'UPSIIDE_USER_TOKEN';
		await res.cookie(cookieName, newJwt.minifiedToken, options);
		res.set('Authorization', `Bearer ${newJwt.minifiedToken}`);
		res.redirect(process.env.MICROSOFT_SSO_REDIRECT);
	} catch (e) {
		next(e);
	}
};

/**
 * Validate the input email to see if belongs to an account with SAML/SSO enabled
 */
module.exports.checkEmail = async (req, res, next) => {
	try {
		await validator.daoEmailValidation(req.query);
		req.query.email = req.query.email.trim();
		const settings = await user.isEmailSaml(req.query.email);
		if (settings) {
			await validator.daoSamlSettings(settings);
			const API_URL = process.env.SSO_API_URL || 'https://sso.upsiide.com';
			const redirectUrl = `${API_URL}/auth/saml/${settings.samlUuid}/login`;

			res.json({redirectUrl});
		} else {
			res.sendStatus(httpStatus.NO_CONTENT);
		}
	} catch (e) {
		next(e);
	}
};

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
module.exports.sendBetterViewLink = async (req, res, next) => {
	try {
		const user = await userService.getUser(req.authJwt, req.user.uuid);

		if (user && user.email) {
			sendGrid.send({email: user.email}, 'better-view-link', {});
		} else {
			throw new NotFoundError('ACCOUNT_NOT_FOUND');
		}

		res.sendStatus(httpStatus.NO_CONTENT);
	} catch (e) {
		next(e);
	}
};

/**
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
module.exports.editUserSettings = async (req, res, next) => {
	try {
		await validator.editUserSettings(req.body);

		if (!req.user.uuid) {
			throw new AuthorizationError('No uuid found in the request');
		}

		const currentUserSettings = await user.getUserSettings(req.user.uuid);
		const currentSettingKeys = (currentUserSettings || []).map((setting) => setting.label);
		const userSettingsTable = 'UserSettings';

		await db.transaction(async (run) => {
			req.body.forEach(async (setting) => {
				if (currentSettingKeys.includes(setting.label)) {
					const {label} = setting;
					console.log('userUuid', req.user.uuid);

					await run(db.update()
						.table(userSettingsTable)
						.set({
							...setting,
							updatedAt: db.expr.now(),
						})
						.where({label, userUuid: req.user.uuid}));
				} else {
					await run(db.insert()
						.into(userSettingsTable)
						.values({
							...setting,
							userUuid: req.user.uuid,
							createdAt: db.expr.now(),
							updatedAt: db.expr.now(),
						}));
				}
			});
		});

		const newSettings = await user.getUserSettings(req.user.uuid);
		res.send(newSettings);
	} catch (e) {
		next(e);
	}
};
