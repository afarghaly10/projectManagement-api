module.exports = {
	hasValidProperties: function(object, properties) {
		let isValid = true;

		properties.forEach(function(property) {
			if ('undefined' === typeof object[property]) {
				isValid = false;
			}
		});

		return isValid;
	},
};
