const axios = require('axios');
const baseUrl = process.env.AUTH_URL || 'http://localhost:1337';
const AccessKey = require('../AccessKey/model');
const applicationId = process.env.applicationId || '1';
const applicationKeyHeaders = {
	'x-application-key': process.env.APPLICATION_KEY || '',
	'x-application-secret': process.env.APPLICATION_SECRET || '',
};
const Account = require('../Account/service');
const AccountModel = require('../Account/account');
const jwt = require('jsonwebtoken');
const jwtDecode = require('jwt-decode');
const JWT_SECRET = process.env.JWT_SECRET;
const {db, AuthorizationError, NotFoundError} = require('../../utility/common/common');
const activityLog = require('../Study/StudyAuditLog/service');
const accountClients = require('../Account/account-clients');

const userSettingsTable = 'UserSettings';

const UserService = {
	logoutAll: async (token) => {
		try {
			const decoded = await AccessKey.decodeJwt(token);
			await AccessKey.removeAllByUuid(decoded.user.uuid);
		} catch (e) {
			throw new Error('LOGOUT_FAILED');
		}
		await axios.post(baseUrl + '/public/logout/all', {}, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		}).catch((e) => {
			throw new AuthorizationError(e.response.data.message);
		});
	},

	logout: async (token) => {
		try {
			const decoded = await AccessKey.decodeJwt(token);
			await AccessKey.removeByJwtAndUuid(decoded.user.uuid, token);
		} catch (e) {
			throw new Error('LOGOUT_FAILED');
		}
		await axios.post(baseUrl + '/public/logout', {}, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		}).catch((e) => {
			throw new AuthorizationError(e.response.data.message);
		});
	},


	checkPrivilege: async (body, authJwt, isSamlUser = false) => {
		const privileges = new Map();
		const adminSpaces = new Map();
		let accountUuid = null;

		// Loop through all privileges and get list of items where the user is potentially an admin.
		for (const space of body.privileges) {
			const scopes = space.scopes;
			const uuid = space?.uuid?.replace('client:', '');
			const displayName = space.displayName;
			const role = space.role;
			const roleCode = space.roleCode;
			const roleLevel = space.roleLevel;

			const existingPrivilege = privileges.get(uuid);

			if (!existingPrivilege || (existingPrivilege && existingPrivilege.roleLevel < roleLevel)) {
				privileges.set(uuid, {
					uuid,
					displayName,
					role,
					roleCode,
					roleLevel,
					scopes,
				});


				// Check role codes that are allowed to have cross access between spaces.
				const allowedRoles = ['ACCOUNT_ADMIN', 'DIG_ADMIN'];

				if (allowedRoles.includes(roleCode)) {
					adminSpaces.set(uuid, {
						uuid,
						displayName,
						role,
						roleCode,
						roleLevel,
						scopes,
					});
				}
			}
		}

		// Loop through all admin spaces
		for (const uuid of adminSpaces.keys()) {
			const space = adminSpaces.get(uuid);

			if (space) {
				const scopes = space.scopes;
				let displayName = space.displayName;
				const role = space.role;
				const roleCode = space.roleCode;
				const roleLevel = space.roleLevel;

				const [account] = await AccountModel.list({
					filter: {clientIds: [uuid]},
					isAdmin: roleCode == 'DIG_ADMIN',
				}, authJwt);
				if (account) {
					accountUuid = account.uuid;

					/**
					 * List all spaces within the account that the current space belongs to,
					 * that way we can make the user have admin rights in all spaces programatically.
					 */
					const spacesWithNames = await Account.listClientsByOwnerUuid(accountUuid, authJwt);
					for (const spaceWithName of spacesWithNames) {
						const spaceUuid = spaceWithName?.uuid?.replace('client:', '');
						/**
						* This is for if the user assigns themselves to account admin
						* in multiple spaces within the same account.
						*/
						if (adminSpaces.has(spaceUuid)) {
							adminSpaces.delete(spaceUuid);
						}

						if (spaceUuid !== uuid) {
							displayName = spaceWithName.name;
							const existingAdminPrivilege = privileges.get(spaceUuid);

							if (!existingAdminPrivilege ||
								(existingAdminPrivilege && existingAdminPrivilege.roleLevel < roleLevel)) {
								privileges.set(spaceUuid, {
									uuid: spaceUuid,
									displayName,
									role,
									roleCode,
									roleLevel,
									scopes,
								});
							}
						}
					}
				}
			}
		}

		const newTokenBody = {
			user: {
				...body.user,
				isSamlUser,
			},
			privileges: Array.from(privileges.values()),
			applicationId: body.applicationId,
			keepAlive: body.keepAlive,
		};

		const expiresIn = '7d';

		const fullToken = jwt.sign(newTokenBody, JWT_SECRET, {
			expiresIn,
		});

		const minifiedToken = jwt.sign({user: newTokenBody.user}, JWT_SECRET, {
			expiresIn,
		});


		return {privileges: Array.from(privileges.values()), accountUuid, fullToken, minifiedToken, newTokenBody};
	},

	login: async (loginDetails) => {
		// Fetch our users token from auth
		const result = await axios.post(baseUrl + '/public/login', {
			email: loginDetails.email,
			password: loginDetails.password,
			keepAlive: loginDetails.keepAlive || false,
			applicationId,
		}, {
			headers: {
				...applicationKeyHeaders,
			},
		})
			.catch((e) => {
				let message = 'UNAUTHENTICATED';

				if (e?.response?.data?.message) {
					message = e.response.data.message;
				}

				throw new AuthorizationError(message, 'UNAUTHENTICATED');
			});


		// login credentials are valid
		if (result.status === 200) {
			let limboState = 'none';
			const token = result.data.token;
			const decodedData = jwtDecode(token);
			const isDigUser = decodedData.privileges.filter(
				(privilege) => privilege?.roleCode?.includes('DIG_ADMIN', 'DIG_EMPLOYEE')
			).length > 0;
			const clientIds = decodedData.privileges.map((privilege) => privilege.uuid.replace('client:', ''));

			let accounts = await accountClients.listAllAccountsByClientUuids(clientIds) || [];

			if (!Array.isArray(accounts)) {
				accounts = [accounts];
			}
			if (!clientIds?.length || !accounts?.length) {
				limboState = 'no_account';
			}

			for (const account of accounts) {
				await activityLog.create('USER', decodedData.user.uuid.replace('user:', ''), null,
					'SIGNED_IN', null, decodedData.user, isDigUser, account.accountId);
			}

			return {
				limboState,
				token: await UserService.processAuthToken(result.data.token, result.data.minifiedKey),
			};
		}
		return false;
	},

	loginAsUser: async (user, adminToken) => {
		if (user?.uuid) {
			const result = await axios.post(baseUrl + '/public/login-as-user', {
				uuid: user.uuid.replace('user:', ''),
				keepAlive: user.keepAlive || false,
				applicationId,
			}, {
				headers: {
					Authorization: `Bearer ${adminToken}`,
					...applicationKeyHeaders,
				},
			}).catch((e) => {
				console.log('Ghosting user error :', e);
				if (Number(e?.response?.status) === 404) {
					throw new NotFoundError('INVALID_CREDENTIALS');
				} else {
					throw new AuthorizationError('UNAUTHENTICATED');
				}
			});
			return await UserService.processAuthToken(result.data.token, result.data.minifiedKey);
		} else {
			throw new AuthorizationError('INVALID_USER');
		}
	},

	processAuthToken: async (token, minifiedKey) => {
		// This will return a full and minified
		const body = AccessKey.decodeJwt(token);
		// Gen new token based off of the full token for accounts
		const newJwt = await UserService.checkPrivilege(body, minifiedKey);

		/**
		 * We need to generate a new key that strips out all of the users clients.
		 * Currently, the jwt is having an overflow issue with cookies
		 */

		const rawAccessKey = {
			userUuid: newJwt.newTokenBody.user.uuid,
			key: newJwt.minifiedToken,
			userData: newJwt.fullToken,
			authJwt: minifiedKey,
			accountUuid: newJwt.accountUuid,
		};

		await AccessKey.create(rawAccessKey);

		return newJwt.minifiedToken;
	},

	getUserClients: async (currentUserUuid, requestedUserUuid, token) => {
		// eslint-disable-next-line max-len
		const response = await axios.get(`${process.env.AUTH_URL}/public/users/${currentUserUuid}/clients?userUuid=${requestedUserUuid}`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					...applicationKeyHeaders,
				},
			}
		);
		return response.data;
	},

	signupForClient: async (email, clientUuid, roleId) => {
		const response = await axios.post(`${process.env.AUTH_URL}/public/users/sign-up`, {
			applicationId,
			email,
			clientUuid,
			roleId,
		},
		{
			headers: {
				...applicationKeyHeaders,
			},
		}
		);
		return response.data;
	},

	async bulkDelete(userUuid, clientUuids, token) {
		return await axios.post(`${process.env.AUTH_URL}/public/bulk-delete-client-users`, {
			clientUuids,
			userUuid,
		}, {
			headers: {
				Authorization: `Bearer ${token}`,
				...applicationKeyHeaders,
			},
		});
	},

	isEmailSaml: async (email) => {
		if (!email) return false;
		const domain = email.split('@').pop();
		const [result] = await db.run(
			db
				.select()
				.all()
				.from('SSODomains', 'SD')
				.join('AccountSettings', 'ACS')
				.on('SD.accountSettingsId=ACS.id')
				.where({
					'SD.domain': domain,
				})
		);
		return result;
	},

	bulkCreateUserSetting: async (settings) => {
		return db.run(db
			.insert()
			.into(userSettingsTable)
			.bulkValues(settings));
	},
	getUserSettings: async (userUuid) => {
		if (!userUuid) return [];
		return db.run(
			db
				.select()
				.all()
				.from('UserSettings')
				.where({
					$or: [
						{userUuid},
						{userUuid: 'user:' + userUuid},
					],
					deletedAt: null,
				}
				));
	},
};

module.exports = UserService;
