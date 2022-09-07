//? Import NPM packages
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');

//? Import GraphQL-related files
const { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema.js');
const graphqlResolver = require('./graphql/resolvers.js');

//? Import all the multer parsing logic from separate file to avoid
//? cluttering main file for no reason. This will handle image uploads
const { multerParser } = require('./util/multer-filter.js');
//? Import the file deletion helper function
const { deleteImage } = require('./util/delete-image.js');
//? Import graphQL authentication module
const auth = require('./util/is-auth.js');

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

//? Handles CORS issues
app.use((req, res, next) => {
	//? Configure the server to accept requests from any website
	res.setHeader('Access-Control-Allow-Origin', '*');
	//? Configure the server to accept these specific request keywords
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
	//? Configure the server to accept headers for content and for authentication
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	//? Send a success message to every OPTIONS HTTP request. This is specially
	//? important to deal with GraphQL requests
	if (req.method === 'OPTIONS') {
		return res.sendStatus(200);
	}
	next();
});

//? REST endpoint to deal with image uploads, since GraphQL can't
app.put(
	//? Endpoint path
	'/uploads',
	//? Handles and processes every request and determine if they
	//? come from an authenticated user or not
	auth,
	(req, res, next) => {
		//? If the user is trying to send a PUT request without being logged
		//? in, return them an error
		if (!req.isAuth) {
			throw new Error('Not authenticated!');
		}
		//? Check if this request has an image in it
		if (!req.file) {
			//? If no image, return a positive response stating no image was
			//? uploaded. This covers both failed upload attempts which will
			//? give a post creation error and also post editing where there
			//? is no need to change the already used image
			return res.status(200).json({ message: 'No file provided!' });
		}

		//? If we are editing a post and a new image is being sent, we need to
		//? delete the old image from the storage
		if (req.body.oldPath) {
			deleteImage(req.body.oldPath);
		}

		//? After completing these checks and possible operations, return a
		//? success message with the path route for the uploaded image
		return res
			.status(201)
			.json({
				message: 'File stored successfully',
				filePath: req.file.path.replace('\\', '/'),
			});
	}
);

//? Serves images to the frontend
app.use('/images', express.static(path.join(__dirname, 'images')));

//? Handling all GraphQL requests in one place
app.use(
	//? To which route requests should be read as GraphQL requests
	'/graphql',
	//? Handles and processes every request and determine if they
	//? come from an authenticated user or not
	auth,
	//? Use GraphQL middleware
	graphqlHTTP({
		//? Where the data schema is defined
		schema: graphqlSchema,
		//? Where is the resolver for queries
		rootValue: graphqlResolver,
		//? Enable access to server + /graphiql for visual
		//? representation of being sent and received
		graphiql: true,
		//? GraphQL error handling function
		customFormatErrorFn(thrownError) {
			//? Checks if the error doesn't have an original error that is
			//? automatically detected by GraphQL, created by us or
			//? a third party package we could be using
			if (!thrownError.originalError) {
				return thrownError;
			}
			//? If there is, we assume this is a controlled, manually
			//? crafted error. Destructure and extract its data and return
			//? the error to the frontend
			const {
				originalError: { data, message = 'An error occurred', statusCode = 500 },
			} = thrownError;
			return { message: message, statusCode: statusCode, data: data };
		},
	})
);

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

//? Use mongoose to start the models imported from './models' and
//? connect to the database using the API key saved in './util/secrets'
mongoose
	.connect(mongoKey)
	.then(() => {
		//? Start the server
		app.listen(restPort);
		console.log('Connected to MongoDB and server is online!');
	})
	.catch(() => {
		console.log('Error connecting to MongoDB');
		throw Error();
	});
