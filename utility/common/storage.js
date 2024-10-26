'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');

class StorageService {
	/**
   *
   * @param bucket
   * @param serverSideEncryption
   * @param accessKeyId
   * @param accessKey
   */
	constructor(bucket, serverSideEncryption, accessKeyId, accessKey) {
		if (accessKeyId && accessKey) {
			AWS.config.update({accessKeyId: accessKeyId, secretAccessKey: accessKey});
		}
		if (process.env.S3_REGION) {
			AWS.config.update({region: process.env.S3_REGION});
		}
		if (serverSideEncryption) {
			this.serverSideEncryption = serverSideEncryption;
		}
		this.bucket = bucket;
		this.service = new AWS.S3({
			signatureVersion: 'v4',
		});
	}

	/**
   * Save file to S3
   * @param {object} file
   * @param {string} file.originalname
   * @param {string} file.encoding
   * @param {string} file.mimetype
   * @param {number} file.size
   * @param {string} file.destination
   * @param {string} file.filename
   * @param {string} file.path
   * @param {Buffer} file.buffer
   * @returns {Promise<{
	 * bucket: string,
	 * provider: string,
	 * location: string,
	 * etag: *,
	 * key: string,
	 * mimetype: string,
	 * size: string}>}
   */
	async upload(file) {
		const path = `${uuid.v4()}/${file.originalname}`;
		const uploadedFile = await this.save(path, file.buffer);
		return {
			...uploadedFile,
			...(file.mimetype && {mimetype: file.mimetype}),
			...(file.size && {size: file.size}),
		};
	}

	/**
   * Save fileBody with path
   * @param {String} path
   * @param {Buffer|Uint8Array|Blob|String|Readable} awsS3Body
   * @returns {Promise<{bucket: string, provider: string, location: string, etag: *, key: string}>}
   */
	async save(path, awsS3Body) {
		const params = {
			Bucket: this.bucket,
			Key: path,
			Body: awsS3Body,
		};
		if (this.serverSideEncryption) {
			params.ServerSideEncryption = this.serverSideEncryption;
		}

		const manageUpload = await this.service.upload(params).promise();
		return {
			provider: 'S3',
			key: manageUpload.Key,
			location: manageUpload.Location,
			bucket: manageUpload.Bucket,
		};
	}

	/**
   * Read file from S3 Bucket
   * @param {String} key
   * @returns {Promise<Buffer>}
   */
	async read(key) {
		const params = {
			Bucket: this.bucket,
			Key: key,
		};

		const objectOutput = await this.service.getObject(params).promise();
		return objectOutput.Body;
	}

	/**
   *
   * @param {String} key
   * @returns {Promise<void>}
   */
	async remove(key) {
		const params = {
			Bucket: this.bucket,
			Key: key,
		};
		await this.service.deleteObject(params).promise();
	}

	/**
	 * get signed url
	 * @param key {string}
	 * @returns {string}
	 */
	getUrl(key) {
		return this.service.getSignedUrl('getObject', {
			Bucket: this.bucket,
			Key: key,
			Expires: 60 * 60 * 24 * 2,
		});
	}

	async tagDeleted(key) {
		await this.service.putObjectTagging({
			Bucket: this.bucket,
			Key: key,
			Tagging: {
				TagSet: [{Key: 'deletedAt', Value: Date.now().toString()}],
			},
		}).promise();
	}
} module.exports = StorageService;
