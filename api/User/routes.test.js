'use strict';

const request = require('supertest');
let app = require('../../app');
const data = {email: `test@domain.com`, password: `password1`};
const sandbox = require('sinon').createSandbox();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const testSetup = require('../../utility/testSetupHelper');
const UserModel = require('./user');
const {db} = require('../../utility/common/common');
const {v4: uuidV4} = require('uuid');
const baseUrl = process.env.AUTH_URL || 'http://localhost:1337';
const sendGrid = require('../../utility/messaging/sendgrid');
const UserController = require('./controller');
const userService = require('./service');
const faker = require('@faker-js/faker').faker;

const baseHubsporUrl = process.env.HUBSPOT_URL;
const baseHubspotApiKey = process.env.HUBSPOT_API_KEY;
const MARKETING_LIST = process.env.HUBSPOT_MARKETING_LIST_ID;
const CUSTOMER_LIST = process.env.HUBSPOT_COSTUMER_LIST_ID;

jest.mock('axios');


describe('User Routes', () => {
	let token;
	let keySetup;
	beforeEach(async () => {
		keySetup = await testSetup.setUpAccessKey();
		token = keySetup.key;
		sandbox.restore();
	});
	afterEach(async () => {
		await testSetup.cleanUpAccessKey(keySetup.userUuid);
		sandbox.restore();
	});

	describe('login(user)', () => {
		test('should login', async () => {
			sandbox.stub(jwt, 'sign').resolves(`${token}`);

			sandbox.stub(UserModel, 'processAuthToken').resolves(token);

			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/login')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
					data: {
						minifiedKey: token,
						token,
					},
					status: 200,
				});

			const response = await request(app)
				.post(`/auth/login`)
				.send(data);

			expect(response.status).toEqual(200);

			const resToken = response.headers.authorization.replace('Bearer ', '');

			expect(resToken).toEqual(token);
		});

		test('should not login – invalid credentials', async () => {
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/login')
				.rejects({
					headers: {
						authorization: `Bearer ${token}`,
					},
					response: {
						data: {
							message: 'UNAUTHENTICATED',
						},
					},
				});

			const userObject = {...data, password: 'INVALID_PASSWORD'};

			const result = await request(app)
				.post(`/auth/login`)
				.send(userObject);
			const error = result.body;

			expect(!!error).toBe(true);
			expect(error.message).toBe('UNAUTHENTICATED');
		});

		test('should login with limboState=no_account', async () => {
			const mockNoAccToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjozOD' +
				'IsInV1aWQiOiJ1c2VyOmFmMDlkOTIwLTFjMmYtNDY3OS04OTFkLWQ2N2JmMTdjOWY2ZCIsImRpc3BsYXlO' +
				'YW1lIjoiTm8iLCJ0b2tlbiI6IjE5ZjUzNjczLTM4MTktNDA3Yy1iZmIwLWFlMjBmYTk5NTA5NiJ9LCJwcm' +
				'l2aWxlZ2VzIjpbXSwiYXBwbGljYXRpb25JZCI6IjEiLCJrZWVwQWxpdmUiOmZhbHNlLCJpYXQiOjE2NDMz' +
				'NzI5ODYsImV4cCI6MTY0Mzk3Nzc4Nn0.iAwHcWgzTUg7TBwI0n40O_2hBNjsv8JMDkTKu_F5sVs';

			sandbox.stub(jwt, 'sign').resolves(`${token}`);

			sandbox.stub(UserModel, 'processAuthToken').resolves(token);

			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/login')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
					data: {
						minifiedKey: token,
						token: mockNoAccToken,
					},
					status: 200,
				});

			const response = await request(app)
				.post(`/auth/login`)
				.send(data);

			const resToken = response.headers.authorization.replace('Bearer ', '');

			expect(resToken).toEqual(token);
			expect(response.body.limboState).toEqual('no_account');
		});
	});

	describe('logout(token)', () => {
		test('should logout', async () => {
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/login')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
					data: {
						minifiedKey: token,
						token,
					},
					status: 200,
				})
				.withArgs(baseUrl + '/public/logout/all')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
				});
			sandbox.stub(UserModel, 'processAuthToken').resolves(token);

			let response = await request(app)
				.post(`/auth/login`)
				.send(data);

			const validToken = response.headers.authorization.replace('Bearer ', '');

			response = await request(app)
				.post(`/auth/logout/all`)
				.set('Authorization', `Bearer ${validToken}`);

			expect(response.status).toEqual(204);
			expect(response.data).toBe(undefined);
			expect(!!response).toBe(true);
		});

		test('should not logout – invalid jwt', async () => {
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/logout')
				.rejects({
					response: {
						data: {
							message: 'UNAUTHENTICATED',
						},
					},
				});

			const response = await request(app)
				.post(`/auth/logout/all`)
				.set('Authorization', `Bearer ${token}_INVALID_TOKEN`);

			const error = response.body;
			expect(!!error).toBe(true);
			expect(error.message).toBe('INVALID_TOKEN');
		});
	});
	describe('logout(token) Single ', () => {
		test('should logout', async () => {
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/login')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
					data: {
						minifiedKey: token,
						token: token,
					},
					status: 200,
				})
				.withArgs(baseUrl + '/public/logout')
				.resolves({
					headers: {
						authorization: `Bearer ${token}`,
					},
					status: 200,
				});
			sandbox.stub(UserModel, 'processAuthToken').resolves(token);

			let response = await request(app)
				.post(`/auth/login`)
				.send(data);


			const validToken = response.headers.authorization.replace('Bearer ', '');

			response = await request(app)
				.post(`/auth/logout`)
				.set('Authorization', `Bearer ${validToken}`);

			expect(response.status).toEqual(204);
			expect(response.data).toBe(undefined);
			expect(!!response).toBe(true);
		});

		test('should not logout – invalid jwt', async () => {
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/logout')
				.rejects({
					response: {
						data: {
							message: 'UNAUTHENTICATED',
						},
					},
				});

			const response = await request(app)
				.post(`/auth/logout`)
				.set('Authorization', `Bearer ${token}_INVALID_TOKEN`);

			const error = response.body;
			expect(!!error).toBe(true);
			expect(error.message).toBe('INVALID_TOKEN');
		});
	});
	describe('remove application client users', () => {
		test('should work', async () => {
			const clientId = uuidV4();
			sandbox
				.stub(axios, 'post')
				.withArgs('http://localhost:1337/public/bulk-remove-client-users')
				.resolves({
					data: [{
						name: 'JEST_TEST',
						uuid: clientId,
					}],
				});
			app = require('../../app');
			const response = await request(app)
				.delete(`/user/clients`)
				.set({'Authorization': token, 'x-client-uuid': clientId})
				.send({
					userUuid: 'user:uuid',
					clientUuids: [clientId],
				});

			expect(response.status).toEqual(204);
		});
	});

	describe('Create users', () => {
		test('should create by invite', async () => {
			const userUuid = uuidV4();

			sandbox
				.stub(axios, 'post')
				.withArgs(`${baseUrl}/public/users/invite`)
				.resolves({
					data: {
						token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF' +
							'tZSI6IkVsdmlzIFByZXNsZXkiLCJpYXQiOjE1MTYyMzkwMjJ9' +
							'.7_3BC0LvwBJ_maH2tZdgHLjcjuCAbCQBGtV5mgni4Yw',
						minifiedKey: 'mockMinifiedKey',
					},
				})
				.withArgs(`${baseHubsporUrl}/crm/v3/objects/contacts?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				)
				.withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${CUSTOMER_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				).withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${MARKETING_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			sandbox.stub(UserModel, 'checkPrivilege').resolves({
				newTokenBody: {
					user: {
						uuid: userUuid,
					},
				},
				minifiedToken: 'mockMinifiedToken',
				fullToken: 'mockFullToken',
				accountUuid: 'mockAccountUuid',
			});
			const reqBody = {
				invitationToken: 'mockInvitationToken',
				password: 'mypass1122$',
				email: 'elvis@google.com',
				marketingMail: false,
			};

			sandbox.stub(axios, 'patch')
				.withArgs(
					// eslint-disable-next-line
					`${baseHubsporUrl}/crm/v3/objects/contacts/${reqBody.email}?idProperty=email&hapikey=${baseHubspotApiKey}`
				)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			app = require('../../app');

			const response = await request(app)
				.put(`/users/invite`)
				.send(reqBody);

			console.log(response.errors);
			expect(response.status).toEqual(200);
			expect(response.body).toEqual({token: 'mockMinifiedToken'});


			const insertedUserSettings = await db.run(
				db.select()
					.all()
					.from('UserSettings')
					.where({userUuid, deletedAt: null})
			);

			expect(insertedUserSettings.find((s) => s.label === 'tc-version')?.value).toEqual('1.0');
			expect(insertedUserSettings.find((s) => s.label === 'sign-up-ip-address')).toBeDefined();

			const insertedAccessKey = await db.run(
				db.select()
					.all()
					.from('AccessKey')
					.where({userUuid})
			);

			expect(insertedAccessKey?.length).toEqual(1);
		});

		test('should create by invite, hubspot sync fails', async () => {
			const userUuid = uuidV4();

			sandbox
				.stub(axios, 'post')
				.withArgs(`${baseUrl}/public/users/invite`)
				.resolves({
					data: {
						token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF' +
							'tZSI6IkVsdmlzIFByZXNsZXkiLCJpYXQiOjE1MTYyMzkwMjJ9' +
							'.7_3BC0LvwBJ_maH2tZdgHLjcjuCAbCQBGtV5mgni4Yw',
						minifiedKey: 'mockMinifiedKey',
					},
				})
				.withArgs(`${baseHubsporUrl}/crm/v3/objects/contacts?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				)
				.withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${CUSTOMER_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				).withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${MARKETING_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			sandbox.stub(UserModel, 'checkPrivilege').resolves({
				newTokenBody: {
					user: {
						uuid: userUuid,
					},
				},
				minifiedToken: 'mockMinifiedToken',
				fullToken: 'mockFullToken',
				accountUuid: 'mockAccountUuid',
			});
			app = require('../../app');
			const reqBody = {
				invitationToken: 'mockInvitationToken',
				password: 'mypass1122$',
				email: 'elvis@google.com',
				marketingMail: true,
			};
			sandbox.stub(axios, 'patch')
				.withArgs(
					// eslint-disable-next-line
					`${baseHubsporUrl}/crm/v3/objects/contacts/${reqBody.email}?idProperty=email&hapikey=${baseHubspotApiKey}`
				)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			const response = await request(app)
				.put(`/users/invite`)
				.send(reqBody);

			expect(response.status).toEqual(200);
			expect(response.body).toEqual({token: 'mockMinifiedToken'});


			const insertedUserSettings = await db.run(
				db.select()
					.all()
					.from('UserSettings')
					.where({userUuid, deletedAt: null})
			);

			expect(insertedUserSettings.find((s) => s.label === 'tc-version')?.value).toEqual('1.0');
			expect(insertedUserSettings.find((s) => s.label === 'sign-up-ip-address')).toBeDefined();

			const insertedAccessKey = await db.run(
				db.select()
					.all()
					.from('AccessKey')
					.where({userUuid})
			);

			expect(insertedAccessKey?.length).toEqual(1);
		});

		test('should create trial sign up', async () => {
			const userUuid = uuidV4();
			const reqBody = {
				invitationToken: 'mockInvitationToken',
				password: 'mypass1122$',
				email: 'elvis@google.com',
				marketingMail: false,
			};
			sandbox
				.stub(axios, 'patch')
				.withArgs(`${baseUrl}/public/users/trial`)
				.resolves({
					data: {
						token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmF' +
							'tZSI6IkVsdmlzIFByZXNsZXkiLCJpYXQiOjE1MTYyMzkwMjJ9' +
							'.7_3BC0LvwBJ_maH2tZdgHLjcjuCAbCQBGtV5mgni4Yw',
						minifiedKey: 'mockMinifiedKey',
					},
				})
				.withArgs(
					// eslint-disable-next-line
					`${baseHubsporUrl}/crm/v3/objects/contacts/${reqBody.email}?idProperty=email&hapikey=${baseHubspotApiKey}`
				)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			sandbox
				.stub(axios, 'post')
				.withArgs(`${baseHubsporUrl}/crm/v3/objects/contacts?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				)
				.withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${CUSTOMER_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				).withArgs(`${baseHubsporUrl}/contacts/v1/lists` +
					`/${MARKETING_LIST}/add?hapikey=${baseHubspotApiKey}`)
				.resolves(
					{
						data: {},
						status: 200,
					}
				);
			sandbox.stub(UserModel, 'checkPrivilege').resolves({
				newTokenBody: {
					user: {
						uuid: userUuid,
					},
				},
				minifiedToken: 'mockMinifiedToken',
				fullToken: 'mockFullToken',
				accountUuid: 'mockAccountUuid',
			});
			app = require('../../app');

			const response = await request(app)
				.patch(`/users/trial`)
				.send(reqBody);

			expect(response.status).toEqual(200);
			expect(response.body).toEqual({token: 'mockMinifiedToken'});


			const insertedUserSettings = await db.run(
				db.select()
					.all()
					.from('UserSettings')
					.where({userUuid, deletedAt: null})
			);

			expect(insertedUserSettings.find((s) => s.label === 'tc-version')?.value).toEqual('1.0');
			expect(insertedUserSettings.find((s) => s.label === 'sign-up-ip-address')).toBeDefined();

			const insertedAccessKey = await db.run(
				db.select()
					.all()
					.from('AccessKey')
					.where({userUuid})
			);

			expect(insertedAccessKey?.length).toEqual(1);
		});
	});
	describe('Sendgrid requests', () => {
		beforeEach(() => {
			jest.spyOn(sendGrid, 'template').mockImplementation();
		});
		afterEach(() => {
			jest.clearAllMocks();
		});

		test('should call sendgrid with correct data for verify password reset', async () => {
			const sendSpy = jest.spyOn(sendGrid, 'send');

			const mockRequest = {
				authJWT: 'mock-jwt-token',
				user: {
					uuid: 'mock-uuid-123',
				},
				body: {
					...data,
					username: 'mock-username',
					firstName: 'mock-firstName',
					lastName: 'mock-lastName',
				},
			};

			sandbox
				.stub(axios, 'patch')
				.withArgs(baseUrl + `/public/users/${mockRequest.user.uuid}`)
				.resolves({
					data: {
						email: data.email,
					},
				});

			await UserController.updateUser(
				mockRequest,
				() => { },
				() => { });

			expect(sendSpy).toHaveBeenCalledWith(
				{
					email: mockRequest.body.email,
					name: mockRequest.body.firstName,
				},
				'verify-password-reset',
				{},
			);
		});
		test('should call sendgrid with correct data for reset password', async () => {
			const sendSpy = jest.spyOn(sendGrid, 'send');
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/password/reset')
				.resolves({
					data: {
						firstName: 'Test First Name',
						resetPasswordUrl: 'http://mock-password.com',
					},
				});

			const userObject = {...data};

			await request(app)
				.post(`/auth/reset-password`)
				.send(userObject);

			expect(sendSpy).toHaveBeenCalledWith(
				{email: data.email},
				'reset-password',
				{resetPasswordUrl: 'http://mock-password.com'});
		});

		test('should not call sendgrid if no reset url is returned for reset password', async () => {
			const sendSpy = jest.spyOn(sendGrid, 'send');
			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/password/reset')
				.resolves({
					data: {
						firstName: 'Test First Name',
					},
				});

			const userObject = {...data};

			await request(app)
				.post(`/auth/reset-password`)
				.send(userObject);

			expect(sendSpy).toHaveBeenCalledTimes(0);
		});

		test('should call sendgrid with correct data for new user invite', async () => {
			const sendSpy = jest.spyOn(sendGrid, 'send');

			const mockRequest = {
				body: {
					email: data.email,
				},
			};

			sandbox
				.stub(axios, 'post')
				.withArgs(baseUrl + '/public/users/trial')
				.resolves({
					data: {
						actionURL: 'test-action-url',
					},
				});

			await UserController.trialSignup(
				mockRequest,
				() => { },
				() => { });

			expect(sendSpy).toHaveBeenCalledWith(
				{
					email: mockRequest.body.email,
				},
				'new-user-invite',
				{
					actionURL: 'test-action-url',
					accountName: 'Upsiide General Resources',
				},
			);
		});

		test('should call sendgrid with correct data for sending better view email', async () => {
			const sendSpy = jest.spyOn(sendGrid, 'send');

			const mockRequest = {
				authJWT: 'mock-jwt-token',
				user: {
					uuid: 'mock-uuid-123',
				},
				body: {},
			};

			sandbox.stub(userService, 'getUser').resolves({email: data.email});

			await UserController.sendBetterViewLink(
				mockRequest,
				() => { },
				() => { });

			expect(sendSpy).toHaveBeenCalledWith({email: data.email}, 'better-view-link', {});
		});
	});

	describe('Self Sign-up', () => {
		const mockUserData = {
			email: 'bruce.wayne@batmail.com',
			invitationToken: 'some-invitation-token',
			password: 'abc12345zyx',
			firstName: 'Bruce',
			lastName: 'Wayne',
			organization: 'Justice League Inc.',
			billingAddress: 'Batcave',
			billingCity: 'Gothan',
			billingState: 'MA',
			billingZip: '02120',
			billingCountry: 'US',
			cardNumber: 'some-card-number',
			expirationMonth: '08',
			expirationYear: '2027',
			cvv: '123',
			organizationSize: 999,
			productHandle: 'professional',
			pricePointHandle: 'original-month-trial',
		};

		beforeAll(() => {
			// moch auth api calls
			axios.post.mockResolvedValue({});
			axios.request.mockResolvedValue({});
			axios.get.mockResolvedValue({});
		});
		test('Should create a user invitation in auth api', async () => {
			await request(app)
				.post(`/users/sign-up`)
				.send({
					email: 'bruce.wayne@batmail.com',
					password: 'somePassword@123',
				});
			expect(axios.post).toHaveBeenCalled();
		});

		test('Should return error if no email provided', async () => {
			const response = await request(app)
				.post(`/users/sign-up`)
				.send({
					sourceUrl: 'https://test.app.upsiide.com',
				});

			expect(response.status).toBe(400);
		});

		test('Should complete a user sign up', async () => {
			const {
				email,
				firstName,
				lastName,
				billingAddress: address,
				billingCity: city,
				billingState: state,
				billingZip: country,
				billingCountry: zip,
			} = mockUserData;
			await request(app)
				.patch(`/users/sign-up`)
				.send({
					email,
					firstName,
					lastName,
					address,
					city,
					state,
					country,
					zip,
					jobTitle: 'CEO',
					organization: 'Some Org LTDA',
					organizationSize: 10,
				});
			expect(axios.post).toHaveBeenCalled();
		});
		test('Should hit the preview subscription on chargify', async () => {
			await request(app)
				.post(`/users/sign-up/preview`)
				.send(mockUserData);
			expect(axios.post).toHaveBeenCalled();
		});
	});

	describe('/user/settings', () => {
		const accountId = uuidV4();

		test('should fail with invalid request, missing value', async () => {
			const items = [{
				'label': 'market-simulator-product-tour-viewed',
				'type': 'string',
			}];

			const response = await request(app)
				.post(`/user/settings`)
				.set({'Authorization': token, 'x-account-uuid': accountId})
				.send(items);

			expect(response.status).toBe(400);
		});

		test('should fail with invalid request, invalid label', async () => {
			const items = [{
				'label': 'label-that-is-not-allowed',
				'type': 'string',
				'value': faker.random.word(),
			}];

			const response = await request(app)
				.post(`/user/settings`)
				.set({'Authorization': token, 'x-account-uuid': accountId})
				.send(items);

			expect(response.status).toBe(400);
		});

		test('should insert new settings', async () => {
			const items = [{
				'label': 'market-simulator-product-tour-viewed',
				'type': 'string',
				'value': faker.random.word(),
			}];

			const response = await request(app)
				.post(`/user/settings`)
				.set({'Authorization': token, 'x-account-uuid': accountId})
				.send(items);

			expect(response.status).toBe(200);

			expect(response.body[0].label).toEqual(items[0].label);
			expect(response.body[0].value).toEqual(items[0].value);
		});

		test('should update values after they have been instarted', async () => {
			const createItems = [{
				'label': 'market-simulator-product-tour-viewed',
				'type': 'string',
				'value': faker.random.word(),
			}];

			// Create
			await request(app)
				.post(`/user/settings`)
				.set({'Authorization': token, 'x-account-uuid': accountId})
				.send(createItems);

			const updateItems = [{
				'label': 'market-simulator-product-tour-viewed',
				'type': 'string',
				'value': faker.random.word(),
			}];

			// Update
			const updateResponse = await request(app)
				.post(`/user/settings`)
				.set({'Authorization': token, 'x-account-uuid': accountId})
				.send(updateItems);

			expect(updateResponse.status).toBe(200);

			expect(updateResponse.body[0].value).toEqual(updateItems[0].value);
		});
	});
});

