module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Teams` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `teamName` varchar(64) NOT NULL,\n' +
		'  `productOwnerUserld` int(11) DEFAULT NULL,\n' +
		'  `projectManagerUserld` int(11) DEFAULT NULL,\n' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  PRIMARY KEY (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Teams`;',
};
