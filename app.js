//? Import NPM packages
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');

//? Import GraphQL-related files
const { graphqlHttp } = require('express-graphql');
const graphqlSchema = require('./graphql/schema.js');
const graphqlResolver = require('./graphql/resolver.js');

//? Import all the multer parsing logic from separate file to avoid
//? cluttering main file for no reason. This will handle image uploads
const { multerParser } = require('./util/multer-filter.js');

//? Import path node module to serve images from "/images" to the front end
const path = require('path');

//! Import the API key for the MongoDB storage.
//! You need to create your own key if you are cloning this project
const { mongoKey } = require('./util/secrets/keys.js');

//? Initialize the app
const app = express();
//? Define the port being used
const restPort = 8080;

//? Parse the JSON data sent in POST and PUT requests
app.use(parser.json());
//? Parse and store files using multer
app.use(multerParser);

//? Serves images to the frontend
app.use('/images', express.static(path.join(__dirname, 'images')));

//? Handles CORS issues
app.use((req, res, next) => {
	//? Configure the server to accept requests from any website
	res.setHeader('Access-Control-Allow-Origin', '*');
	//? Configure the server to accept these specific request keywords
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	//? Configure the server to accept headers for content and for authentication
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	next();
});

//? General error handler for any thrown errors inside express
app.use((error, req, res, next) => {
	console.log(error);
	//? Pull the status code from any catch blocks. If no status code, set as 500
	const status = error.statusCode || 500;
	//? Pull what message was thrown in the error
	const message = error.message;
	//? Pull any validation errors that might have ocurred
	const errors = error.allErrors;
	//? Send back a response considering the status code, message error and validation errors
	res.status(status).json({ message: message, data: errors });
});

//? Handling all GraphQL requests in one place
app.use('/graphql', graphqlHttp({ schema: graphqlSchema, rootValue: graphqlResolver }));

//? Use mongoose to start the models imported from './models' and
//? connect to the database using the API key saved in './util/secrets'
mongoose
	.connect(mongoKey)
	.then(() => {
		//? Start the server
		app.listen(restPort);
		console.log('Connected to MongoDB! Socket.IO and server are online!');
	})
	.catch(() => {
		console.log('Error connecting to MongoDB');
		throw Error();
	});
