'use strict';

const user = require('./user');
const {AuthenticationError} = require('../../utility/common/common');
const data = {email: `test@domain.com`, password: `password`};
let sandbox;

describe.skip('user.js', () => {
	// @TODO Update to use proper stubs for new auth system setup
	beforeAll(async () => {
		// https://github.com/facebook/jest/issues/8379
		// sandbox = require('sinon').createSandbox();
		// token = await user.login(data);
	});
	afterEach(async () => {
		sandbox.restore();
	});

	describe('login(user)', () => {
		test('should login', async () => {
			// sandbox
			// 	.stub(axios, 'post')
			// 	.withArgs(baseUrl + 'auth/login')
			// 	.resolves({
			// 		headers: {
			// 			authorization: `Bearer ${token}`,
			// 		},
			// 	});
			const testToken = await user.login(data);

			expect(!!testToken).toBe(true);
		});

		test('should not login – invalid credentials', async () => {
			// sandbox
			// 	.stub(axios, 'post')
			// 	.withArgs(baseUrl + 'auth/login')
			// 	.rejects({
			// 		headers: {
			// 			authorization: `Bearer ${token}`,
			// 		},
			// 		response: {
			// 			data: {
			// 				message: 'INVALID_CREDENTIALS',
			// 			},
			// 		},
			// 	});
			let error = null;

			try {
				const userObject = {...data, password: 'INVALID_PASSWORD'};
				await user.login(userObject);
			} catch (e) {
				error = e;
			}

			expect(!!error).toBe(true);
			expect(error instanceof AuthenticationError).toBe(true);
		});
	});

	describe('logout(token)', () => {
		test('should logout', async () => {
			// sandbox
			// 	.stub(axios, 'post')
			// 	.withArgs(baseUrl + 'auth/login')
			// 	.resolves({
			// 		headers: {
			// 			authorization: `Bearer ${token}`,
			// 		},
			// 	})
			// 	.withArgs(baseUrl + 'auth/logout')
			// 	.resolves({
			// 		headers: {
			// 			authorization: `Bearer ${token}`,
			// 		},
			// 		status: 204,
			// 		data: '',
			// 	});
			const validToken = await user.login(data);

			const result = await user.logout(validToken);

			expect(result.status).toEqual(204);
			expect(result.data).toBe('');
			expect(!!result).toBe(true);
		});

		test('should not logout – invalid jwt', async () => {
			// sandbox
			// 	.stub(axios, 'post')
			// 	.withArgs(baseUrl + 'auth/logout')
			// 	.rejects({
			// 		response: {
			// 			data: {
			// 				message: 'UNAUTHENTICATED',
			// 			},
			// 		},
			// 	});
			let error = null;

			try {
				await user.logout(null);
			} catch (e) {
				error = e.message;
			}

			expect(error).toEqual('Invalid token specified');
			expect(!!error).toBe(true);
		});
	});
});
