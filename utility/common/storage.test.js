'use strict';

const fs = require('fs');
const sinon = require('sinon');
const AWS = require('aws-sdk');
const StorageService = require('./storage');

describe('StorageService', () => {
	let sandbox;
	beforeAll(() => {
		const sandbox = sinon.createSandbox();
		sandbox.stub(AWS, 'S3').returns({
			upload: sandbox.stub().returns({promise: sandbox.stub().resolves({
				Key: 'test.png',
				Location: 'https://testbucket.s3.amazon.com/test.png',
				ETag: 'image',
				Bucket: 'testbucket',
			})}),
			getObject: sandbox.stub().returns({promise: sandbox.stub().resolves({Body: new Buffer('')})}),
			deleteObject: sandbox.stub().returns({promise: sandbox.stub().resolves({})}),
		});
	});

	afterAll(() => {
		sandbox.restore();
	});

	describe('#constructor(bucket, serverSideEncryption, accessKeyId, accessKey)', () => {
		test('should create instance', () => {
			const bucketName = 'test';
			const storage = new StorageService(bucketName);
			expect(storage.bucket).toEqual(bucketName);
			expect(storage).toBeInstanceOf(StorageService);
		});
	});

	describe('#upload(file)', () => {
		test('should upload file', async () => {
			const storage = new StorageService('testbucket');
			const result = await storage.upload({
				filename: 'test.png',
				originalname: 'test.png',
				mimetype: 'image/png',
				size: 1040000,
				buffer: fs.readFileSync(__dirname + '/assets/test.png'),
			});
			expect(result.location).toContain('test.png');
			expect(result.mimetype).toEqual('image/png');
			expect(result.size).toEqual(1040000);
		});
	});

	describe('#read(key)', () => {
		test('should read file', async () => {
			const storage = new StorageService('testbucket');
			const result = await storage.read('test.png');
			expect(result).toBeInstanceOf(Buffer);
		});
	});

	describe('#remove(key)', () => {
		test('should delete file', async () => {
			const storage = new StorageService('testbucket');
			await storage.remove('test.png');
		});
	});

	describe('#save(path, body)', () => {
		test('should save file', async () => {
			const storage = new StorageService('testbucket');
			const buffer = fs.readFileSync(__dirname + '/assets/test.png');
			const uploadedFile = await storage.save('test.png', buffer);
			expect(uploadedFile.provider).toEqual('S3');
			expect(uploadedFile.key).toEqual('test.png');
			expect(uploadedFile.location).toContain('test.png');
			expect(uploadedFile.location).toContain('testbucket');
		});
	});
});
