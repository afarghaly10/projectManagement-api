module.exports = {
	up:
		'CREATE TABLE IF NOT EXISTS `Projects` (\n' +
		'  `id` int(11) NOT NULL AUTO_INCREMENT,\n' +
		'  `name` varchar(64) NOT NULL,\n' +
		'  `status` varchar(64) NULL DEFAULT NULL,\n' +
		'  `description` varchar(512) DEFAULT NULL,\n' +
		'  `startDate` DATETIME NULL DEFAULT NULL,' +
		'  `endDate` DATETIME NULL DEFAULT NULL,' +
		'  `createdAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `updatedAt` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,' +
		'  `deletedAt` TIMESTAMP NULL DEFAULT NULL,' +
		'  PRIMARY KEY (`id`)\n' +
		');',
	down: 'DROP TABLE IF EXISTS `Projects`;',
};
