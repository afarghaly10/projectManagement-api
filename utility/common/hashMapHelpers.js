module.exports = {
	hashObjectBy(array, keyName, useLowerCase = false) {
		const finalObject = {};
		const ArrayKeys = {};
		if (useLowerCase) {
			for (const item of array) {
				if (typeof finalObject[String(item[String(keyName)]).toLowerCase()] !== 'undefined') {
					// there is a record already.
					if (ArrayKeys[item[keyName].toLowerCase()]) {
						// is already array
						finalObject[item[keyName].toLowerCase()].push(item);
					} else {
						// not array yet
						const temp = finalObject[item[keyName].toLowerCase()];
						finalObject[item[keyName].toLowerCase()] = [];
						finalObject[item[keyName].toLowerCase()].push(temp);
						finalObject[item[keyName].toLowerCase()].push(item);
						ArrayKeys[item[keyName].toLowerCase()] = true;
					}
				} else {
					finalObject[item[keyName].toLowerCase()] = item;
				}
			}
		} else {
			for (const item of array) {
				if (typeof finalObject[String(item[String(keyName)])] !== 'undefined') {
					// there is a record already.
					if (ArrayKeys[item[keyName]]) {
						// is already array
						finalObject[item[keyName]].push(item);
					} else {
						// not array yet
						const temp = finalObject[item[keyName]];
						finalObject[item[keyName]] = [];
						finalObject[item[keyName]].push(temp);
						finalObject[item[keyName]].push(item);
						ArrayKeys[item[keyName]] = true;
					}
				} else {
					finalObject[item[keyName]] = item;
				}
			}
		}
		return finalObject;
	},

	hashObjectBySubKey(array, keyName, subKey = false, useLowerCase = false) {
		const finalObject = {};
		if (subKey) {
			array.map((val) =>
				finalObject[(useLowerCase) ?
					val[keyName][subKey].toLowerCase() :
					val[keyName][subKey]] = val);
		} else {
			array.map((val) =>
				finalObject[(useLowerCase) ?
					val[keyName].toLowerCase() :
					val[keyName]] = val);
		}
		return finalObject;
	},

	hashToArray(hashedObject) {
		let finalObject = [];

		for (const item in hashedObject) {
			if (Object.hasOwnProperty.call(hashedObject, item)) {
				if (Array.isArray(hashedObject[item])) {
					finalObject = [...finalObject, ...hashedObject[item]];
				} else {
					finalObject.push(hashedObject[item]);
				}
			}
		}
		return finalObject;
	},

	changeHashKey(hashedObject, newKey, useLowerCase = false) {
		const finalObject = [];
		for (const key in hashedObject) {
			if (Object.hasOwnProperty.call(hashedObject, key)) {
				const element = hashedObject[key];
				if (Array.isArray(element)) {
					for (const subElement of element) {
						finalObject.push(subElement);
					}
				} else {
					finalObject.push(element);
				}
			}
		}
		return this.hashObjectBy(finalObject, newKey, useLowerCase);
	},

};
