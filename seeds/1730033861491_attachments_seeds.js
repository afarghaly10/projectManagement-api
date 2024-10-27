module.exports = {
	up:
		'INSERT INTO Attachments (fileURL, fileName, taskId, uploadedById) VALUES ' +
		'("i1.jpg", "DesignDoc.pdf", 1, 1), ' +
		'("i2.jpg", "NavAlgorithm.pdf", 2, 3), ' +
		'("i3.jpg", "EnergySolutions.pdf", 3, 5), ' +
		'("i4.jpg", "SoftwareWorkflow.pdf", 4, 7), ' +
		'("i5.jpg", "AIPredictions.pdf", 5, 9), ' +
		'("i6.jpg", "BiotechTest.pdf", 6, 11), ' +
		'("i7.jpg", "GolfAI.pdf", 7, 13), ' +
		'("i8.jpg", "HotelDB.pdf", 8, 15), ' +
		'("i9.jpg", "TelecomUpgrade.pdf", 9, 17), ' +
		'("i10.jpg","SecurityProtocol.pdf", 10, 19);',
	down: '',
};
