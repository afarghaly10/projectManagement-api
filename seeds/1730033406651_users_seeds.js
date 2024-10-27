module.exports = {
	up:
		'INSERT INTO Users (username, teamId, profilePictureUrl, cognitoId) VALUES ' +
		'("AliceJones", 1, "p1.jpeg", "123e4567-e89b-12d3-a456-426614174001"), ' +
		'("BobSmith", 1, "p2.jpeg", "123e4567-e89b-12d3-a456-426614174002"), ' +
		'("CharlieBrown", 2, "p3.jpeg", "123e4567-e89b-12d3-a456-426614174003"), ' +
		'("DaisyJohnson", 2, "p4.jpeg", "123e4567-e89b-12d3-a456-426614174004"), ' +
		'("EveWhite", 3, "p5.jpeg", "123e4567-e89b-12d3-a456-426614174005"), ' +
		'("FrankBlack", 3, "p6.jpeg", "123e4567-e89b-12d3-a456-426614174006"), ' +
		'("GraceBrown", 4, "p7.jpeg", "123e4567-e89b-12d3-a456-426614174007"), ' +
		'("HenrySmith", 4, "p1.jpeg", "123e4567-e89b-12d3-a456-426614174008"), ' +
		'("IsabellaGreen", 5, "p2.jpeg", "123e4567-e89b-12d3-a456-426614174009"), ' +
		'("JackWhite", 5, "p3.jpeg", "123e4567-e89b-12d3-a456-426614174010"), ' +
		'("KatherineBrown", 1, "p4.jpeg", "123e4567-e89b-12d3-a456-426614174011"), ' +
		'("LiamSmith", 1, "p5.jpeg", "123e4567-e89b-12d3-a456-426614174012"), ' +
		'("MiaBlack", 2, "p6.jpeg", "123e4567-e89b-12d3-a456-426614174013"), ' +
		'("NathanGreen", 2, "p7.jpeg", "123e4567-e89b-12d3-a456-426614174014"), ' +
		'("OliviaWhite", 3, "p1.jpeg", "123e4567-e89b-12d3-a456-426614174015"), ' +
		'("PeterBrown", 3, "p2.jpeg", "123e4567-e89b-12d3-a456-426614174016"), ' +
		'("QuinnSmith", 4, "p3.jpeg", "123e4567-e89b-12d3-a456-426614174017"), ' +
		'("RoseGreen", 4, "p4.jpeg", "123e4567-e89b-12d3-a456-426614174018"), ' +
		'("SamWhite", 5, "p5.jpeg", "123e4567-e89b-12d3-a456-426614174019"), ' +
		'("TinaBrown", 5, "p6.jpeg", "123e4567-e89b-12d3-a456-426614174020"), ' +
		'("UlyssesSmith", 1, "p7.jpeg", "123e4567-e89b-12d3-a456-426614174021"), ' +
		'("VictorHugo", 5, "p7.jpeg", "123e4567-e89b-12d3-a456-426614174022");',
	down: '',
};
