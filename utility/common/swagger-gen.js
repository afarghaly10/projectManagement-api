const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const jsyaml = require('js-yaml');
const deepmerge = require('deepmerge');

// swagger definition
const swaggerDefinition = {
	info: {
		title: 'Node Swagger API',
		version: '1.0.0',
		description: 'Demonstrating how to describe a RESTful API with Swagger',
	},
	host: 'localhost:2600',
	basePath: '/',
};

// options for the swagger docs
const options = {
	// import swaggerDefinitions
	swaggerDefinition: swaggerDefinition,
	// path to the API docs
	apis: ['./api/**/*.js'],
};

const currentYaml = jsyaml.safeLoad(fs.readFileSync('swagger.yaml'), 'utf-8');

const swaggerSpec = swaggerJSDoc(options);

const swaggerJson = deepmerge(currentYaml, swaggerSpec);

fs.writeFile('swagger-gen.json', JSON.stringify(swaggerJson), (err) => {
	if (err) throw err;
});
