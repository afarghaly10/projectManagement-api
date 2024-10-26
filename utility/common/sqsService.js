'use strict';
const AWS = require('aws-sdk');

class SqsService {
	/**
	 * @param config Object
	 * config.accessKeyId?: string,
	 * config.accessKey?: string,
	 * config.region: string,
	 * config.sqsName: string,
	 * config.accountId: string
	 */
	constructor(config) {
		if (config.accessKeyId && config.accessKey) {
			AWS.config.update({
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			});
		}
		this.sqs = new AWS.SQS({region: config.region});
		// eslint-disable-next-line max-len
		this.queueUrl = 'https://sqs.' + config.region + '.amazonaws.com/' + config.accountId + '/' + config.sqsName;
	}

	async sendMessage(messageBody) {
		const params = {
			MessageBody: JSON.stringify({...messageBody}),
			QueueUrl: this.queueUrl,
		};
		return new Promise((resolve, reject) => {
			this.sqs.sendMessage(params, (err, data) => {
				if (err) {
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}

	async deleteMessage(receiptHandle) {
		const params = {
			ReceiptHandle: receiptHandle,
			QueueUrl: this.queueUrl,
		};
		return new Promise((resolve, reject) => {
			this.sqs.deleteMessage(params, (err, data) => {
				if (err) {
					console.error(err);
					reject(err);
				} else {
					resolve(data);
				}
			});
		});
	}
}

module.exports = SqsService;
