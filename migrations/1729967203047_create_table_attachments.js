module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Attachments` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `fileUrl` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `fileName` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `taskId` int(11) NOT NULL,\n' +
		'  `uploadedById` int(11) NOT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\n' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,\n' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,\n' +
		'  PRIMARY KEY (`id`),\n' +
		'  CONSTRAINT `AttachmentsTasks_ibfk_1` FOREIGN KEY (`taskId`) REFERENCES `Tasks` (`id`),\n' +
		'  CONSTRAINT `AttachmentsUsers_ibfk_1` FOREIGN KEY (`uploadedById`) REFERENCES `Users` (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Attachments`;',
};
