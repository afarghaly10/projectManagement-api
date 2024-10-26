/* Returns keys of the object */
const keys = (object) => Object.keys(object);
// const values = (object) => Object.values(object);

/* Map values of an object leaving the keys as is */
const mapValues = (object, predicate) => {
	const result = {};
	keys(object).forEach((key) => (result[key] = predicate(object[key], key, object)));
	return result;
};

/* Types helpers */
const isNull = (value) => value === null;
const isObject = (value) => typeof value === 'object' && !isNull(value);
const isFunction = (func) => typeof func === 'function';
const isBoolean = (func) => typeof func === 'boolean';
const isDate = (value) => !isNaN(new Date(value));

/* Return the items of setA that do not appear in setB */
const subset = (setA, setB) => setA.filter((setAItem) => setB.indexOf(setAItem) === -1);

/* Checks a condition and returs false if condition returns true, otherwise returns the message */
const check = (condition, message, v) =>
	(isFunction(condition) ? condition(v) : condition) ? false : isFunction(message) ? message(v) : message;

const operators = {};

/* Type checks */
operators.object = () => (value, error) => error || check(isObject(value), 'should be an object');

operators.array = () => (value, error) => error || check(Array.isArray(value), 'should be an array');

operators.number = () => (value, error) => error || check(typeof value === 'number', 'should be a number');

operators.string = () => (value, error) => error || check(typeof value === 'string', 'should be a string');

operators.null = () => (value, error) => error || check(isNull(value), 'should be null');

operators.date = () => (value, error) => error || check(isDate(value), 'should be a date');

operators.boolean = () => (value, error) => error || check(isBoolean(value), 'should be a boolean');

/* Number validation operators */
operators.positive = () => (value, error) => error || check(value > 0, 'should be positive');

/* Custom validation */
operators.custom = (f, message) => (value, error) => error || check(f(value), message);

/* Combination operators */
operators.and = (...validators) => (value, error) =>
	validators.reduce(($error, $validator) => $error || $validator.perform(value), error);

operators.or = (...validators) => (value, error) => {
	const errors = validators.map((validator) => validator.perform(value)).filter((e) => !!e);

	if (errors.length === validators.length) {
		return error || errors.join(' or ');
	} else {
		return error;
	}
};

operators.not = (validator, message) => (value, error) => error || (validator.perform(value) ? false : message);

operators.optional = () => (value, error) => (typeof value === 'undefined' || value == null ? false : error);

operators.keys = (validators, onOdd) => (value, error) => {
	/* We have some odd keys here */
	if (isFunction(onOdd)) {
		const oddKeys = subset(keys(value), keys(validators));

		if (oddKeys.length > 0) {
			onOdd(oddKeys);
		}
	}

	return keys(validators).reduce((error, key) => {
		const checkResult = check(
			(error) => error === false,
			(error) => `${key}: ${error}`,
			validators[key].perform(value[key], false)
		);

		return error || checkResult;
	}, error);
};

operators.schema = (validators, onOdd) => operators.and(wrapper().object(), wrapper().keys(validators, onOdd));

operators.each = (validator) => (value, error) => value.reduce((e, v) => e || validator.perform(v, false), error);
operators.collection = (validator) => operators.and(wrapper().array(), wrapper().each(validator));

const wrapper = (validators = []) => ({
	perform: (value, error = false) => validators.reduce((error, validator) => validator(value, error), error),
	...mapValues(operators, (operator) => (...args) => wrapper(validators.concat([operator(...args)]))),
});

wrapper.extend = (name, validator) => {
	operators[name] = validator;
	return wrapper;
};

module.exports = wrapper;
