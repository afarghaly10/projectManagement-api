/**
 * SQL Query builder
 */
const mysql = require('mysql2');

if (typeof process.env.DB_HOST == 'undefined') require('dotenv').config();
const connectionLimit = process.env.DB_CONNECTION_LIMIT || 10;
const pool = mysql.createPoolPromise({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
	port: process.env.DB_PORT,
	waitForConnections: true,
	connectionLimit: connectionLimit,
	queueLimit: 0,
});

/**
 * Simple functional helpers
 */
const isNull = (value) => value === null;
const isObject = (value) => typeof value === 'object' && !isNull(value);

const keys = (object) => Object.keys(object);

const mapValues = (object, predicate) => {
	const result = {};
	keys(object).forEach((key) => (result[key] = predicate(object[key], key, object)));
	return result;
};

/**
 * Expression class
 *
 * This class' instances are used to build
 * SQL expressions like `now()` `COUNT(id)`
 */
class Expression {
	constructor(data, treatAsValue = false) {
		if (data instanceof Expression) {
			this.str = data.toString();
		} else if (isObject(data) && data.__proto__ === Object.prototype) {
			// here we check the object for not being date or anything else, just {} simple object
			/* Build from sce */
			this.str = simpleConditionExpressionToExpression(data).toString();
		} else {
			/* Build from str or another expression */
			this.str = treatAsValue ? expr.value(data).toString() : data.toString();
		}
	}

	toString() {
		return this.str;
	}
}

/**
 * Expression operators
 */
const expr = (value) => new Expression(value);

/* Expression wrappers for id and value */
expr.id = (value) => new Expression(pool.escapeId(value));
expr.value = (value) => new Expression(pool.escape(value));

/* Expression operators */
expr.equals = (a, b) => new Expression(`${a.toString()} = ${b.toString()}`);
expr.isNull = (a) => new Expression(`${a.toString()} IS NULL`);
expr.isNotNull = (a) => new Expression(`${a.toString()} IS NOT NULL`);
expr.gt = (a, b) => new Expression(`${a.toString()} > ${b.toString()}`);
expr.now = () => new Expression(`now()`);
expr.like = (a, b) => new Expression(`${a.toString()} LIKE ${b.toString()}`);
expr.notLike = (a, b) => new Expression(`${a.toString()} NOT LIKE ${b.toString()}`);
expr.and = (...args) =>
	new Expression(
		args.length > 1
			? `(${args.map((a) => a.toString()).join(' AND ')})`
			: args.map((a) => a.toString()).join(' AND ')
	);
expr.or = (...args) =>
	new Expression(
		args.length > 1 ? `(${args.map((a) => a.toString()).join(' OR ')})` : args.map((a) => a.toString()).join(' OR ')
	);
expr.in = (a, args) => (args.length > 0 ? new Expression(`${a} IN (${args.join(', ')})`) : new Expression(''));
expr.inStr = (a, args) => (args.length > 0 ? new Expression(`${a} IN ('${args.join('\', \'')}')`) : new Expression(''));
expr.notIn = (a, args) => (args.length > 0 ? new Expression(`${a} NOT IN (${args.join(', ')})`) : new Expression(''));
expr.count = (a) => new Expression(`COUNT(${a.toString()})`);
expr.sum = (a) => new Expression(`SUM(${a.toString()})`);

/* Take a value and leave it with no changes if it is an expression or treat it as value if it isn't */
expr.valueOrExpression = (data) => new Expression(data, true);

/**
 * Simple Condition Expression
 * SCE is a way to write expressions for condition based clauses
 * like WHERE and ON
 */
const simpleConditionExpressionToExpression = (sce) =>
	expr.and(...keys(sce).map((key) => simpleConditionItemToExpression(key, sce[key])));

/**
 * Transform a pair of simple condition expression like { id: 2 }
 * to expression
 */
const simpleConditionItemToExpression = (key, value) =>
	specialConditionItems[key] ? specialConditionItems[key](value) : simpleConditionValueToExpression(key, value);

/**
 * Special Condition Item is OR or AND item of Simple Condition like
 *
 * { $or: [{ id: 2 }, { imageId: null }]}
 * { $and: [{ id: 2 }, { imageId: null }]}
 */
const specialConditionItems = {};

/* OR and AND specialt condition items implementation */
specialConditionItems['$or'] = ([...args]) => expr.or(...args.map((arg) => simpleConditionExpressionToExpression(arg)));
specialConditionItems['$and'] = ([...args]) =>
	expr.and(...args.map((arg) => simpleConditionExpressionToExpression(arg)));

/**
 * If no Special Condition Item is detected, let's transform in a common way
 *
 * Here we also have to treat special cases like null, { $gt: 2 } and so on.
 */
const simpleConditionValueToExpression = (key, value) =>
	specialConditionValues.reduce((result, scvfunc) => result || scvfunc(key, value), false) ||
	expr.equals(expr.id(key), expr.valueOrExpression(value));

const specialConditionValues = [];

/* undefined case */
specialConditionValues.push((key, value) => (value === undefined ? 'TRUE' : false));

/* is NOT NULL case */
specialConditionValues.push((key, value) =>
	isObject(value) && '$not' in value && value['$not'] === null ? expr.isNotNull(expr.id(key)) : false
);

/* is NULL case */
specialConditionValues.push((key, value) => (value === null ? expr.isNull(expr.id(key)) : false));

/* > ? case */
specialConditionValues.push((key, value) =>
	isObject(value) && '$gt' in value ? expr.gt(expr.id(key), expr.valueOrExpression(value['$gt'])) : false
);

/* LIKE */
specialConditionValues.push((key, value) =>
	isObject(value) && '$like' in value ? expr.like(expr.id(key), expr.valueOrExpression(value['$like'])) : false
);

/* NOT LIKE */
specialConditionValues.push((key, value) =>
	isObject(value) && '$not' in value && isObject(value['$not']) && '$like' in value['$not']
		? expr.notLike(expr.id(key), expr.valueOrExpression(value['$not']['$like']))
		: false
);

/* IN */
specialConditionValues.push((key, value) =>
	isObject(value) && '$in' in value
		? expr.in(expr.id(key), value['$in'].map((item) => expr.valueOrExpression(item)))
		: false
);

/* NOT IN */
specialConditionValues.push((key, value) =>
	isObject(value) && '$not' in value && isObject(value['$not']) && '$in' in value['$not']
		? expr.notIn(expr.id(key), value['$not']['$in'].map((item) => expr.valueOrExpression(item)))
		: false
);

/**
 * Main operators mechanism
 */
const operators = {};

/* Select all fields */
operators.all = () => '*';

/* A helper to Select a specific field */
const field = (config) =>
	Array.isArray(config)
		? `${expr(config[0]).toString()} AS ${expr.id(config[1]).toString()}`
		: expr(config).toString();

/* Select specific fields like $.fields('name', 'age'), supports expressions */
operators.fields = (...config) => config.map((fieldConfig) => field(fieldConfig)).join(', ');

/* Insert values into table, like $.values({ name: 'Tyler', age: 25 }) */
operators.values = (config) => {
	const keysString = keys(config)
		.map((key) => expr.id(key).toString())
		.join(', ');

	const valuesString = keys(config)
		.map((key) => expr.valueOrExpression(config[key]).toString())
		.join(', ');

	return `(${keysString}) VALUES (${valuesString})`;
};

/* Insert bulk values into table like $.values([{name: 'Tyler', age: 25}]) */
operators.bulkValues = (config) => {
	let keysString = '';
	const inserts = [];
	config.forEach((insert) => {
		keysString = keys(insert)
			.map((key) => expr.id(key).toString())
			.join(', ');

		const insertString = keys(insert)
			.map((key) => expr.valueOrExpression(insert[key]).toString())
			.join(', ');
		inserts.push(`(${insertString})`);
	});

	const bulkInserts = inserts.join(', ');

	return `(${keysString}) VALUES ${bulkInserts}`;
};

/* Set values for update query, like $.set({ name: 'Tyler', age: 20 }) */
operators.set = (config) => {
	const setString = keys(config)
		.map((key) => `${expr.id(key).toString()} = ${expr.valueOrExpression(config[key]).toString()}`)
		.join(', ');

	return `SET ${setString}`;
};

/* Set a table for insert query, like $.into('Table') */
operators.into = (source) => `INTO ${expr.id(source).toString()}`;

/* Set a table to select from */
operators.from = (source, alias) =>
	`FROM ${expr.id(source).toString()}${alias ? ` AS ${expr.id(alias).toString()}` : ''}`;

/* Set a subquery to select from like $.fromSubquery(db.select().all().from('Tables')) */
operators.fromSubquery = (source, alias) =>
	`FROM (${source.toString()})${alias ? ` ${expr.id(alias).toString()}` : ''}`;

/* Simple limit and skip subqueries */
operators.limit = (count) => `LIMIT ${expr.value(count).toString()}`;
operators.offset = (count) => `OFFSET ${expr.value(count).toString()}`;

/* Set a table for update query */
operators.table = (source) => `${expr.id(source).toString()}`;

/* Set a join */
operators.join = (name, alias, type) =>
	`${type ? `${type} ` : ''}JOIN ${expr.id(name).toString()}${alias ? ` ${expr.id(alias).toString()}` : ''}`;

/* Set an expression to join on */
operators.on = (config) => `ON ${expr(config).toString()}`;

/* Set WHERE */
operators.where = (config) => `WHERE ${expr(config).toString()}`;

/* Set GROUP BY */
operators.group = (config) => `GROUP BY ${config}`;

/* Set HAVING */
operators.having = (config) => `HAVING ${expr(config).toString()}`;

operators.union = (subquery, all = false) => `UNION${all ? ' ALL' : ''} ${subquery.toString()}`;

const orderItem = (item) =>
	Array.isArray(item) ? `${expr.id(item[0]).toString()} ${expr(item[1]).toString()}` : expr.id(item);

operators.order = (...args) => `ORDER BY ${args.map((item) => orderItem(item)).join(', ')}`;

/* Query wrapper */
const query = (queryString) => ({
	...mapValues(operators, (operator) => (...args) => query(`${queryString} ${operator(...args)}`)),
	toString: () => queryString,
});
let connectionsCount = 0;

const openConnectionLog = () => {
	if (!process.env.DEBUG_MODE) return;
	console.log('opening connections');
	connectionsCount++;
	console.log('openedConnections', connectionsCount);
};

const closeConnectionLog = () => {
	if (!process.env.DEBUG_MODE) return;
	console.log('closing connection');
	connectionsCount--;
	console.log('openedConnections', connectionsCount);
};

module.exports = {
	query: pool.query,
	execute: pool.execute,
	run: async (query) => {
		const conn = await pool.getConnection();
		try {
			openConnectionLog();
			const result = await conn.execute(query.toString()).then(([result]) => result);
			await conn.destroy();
			closeConnectionLog();
			return result;
		} catch (e) {
			console.error(query.toString());
			await conn.destroy();
			closeConnectionLog();
			throw e;
		}
	},

	insert: () => query('INSERT'),
	select: () => query('SELECT'),
	update: () => query('UPDATE'),
	delete: () => query('DELETE'),

	expr,

	transaction: async (transactionFunc) => {
		const conn = await pool.getConnection();
		try {
			openConnectionLog();
			await conn.query('START TRANSACTION');
			const result = await transactionFunc((query) => {
				return conn.execute(query.toString()).then(([result]) => result);
			});
			await conn.query('COMMIT');
			await conn.destroy();
			closeConnectionLog();
			return result;
		} catch (e) {
			await conn.query('ROLLBACK');
			await conn.destroy();
			closeConnectionLog();
			throw e;
		}
	},
};
