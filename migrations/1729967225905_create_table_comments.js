module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Comments` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `userId` int(11) NOT NULL,\n' +
		'  `taskId` int(11) NOT NULL,\n' +
		'  `text` varchar(512) COLLATE utf8_unicode_ci DEFAULT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  PRIMARY KEY (`id`),\n' +
		'  CONSTRAINT `CommentsTasks_ibfk_1` FOREIGN KEY (`taskId`) REFERENCES `Tasks` (`id`),\n' +
		'  CONSTRAINT `CommentsUsers_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `Users` (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Comments`;',
};
