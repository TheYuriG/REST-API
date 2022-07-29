//? Import NPM packages
const express = require('express');
const parser = require('body-parser');
const mongoose = require('mongoose');

//? Import path node module to serve images from "/images" to the front end
const path = require('path');

//! Import the API key for the MongoDB storage.
//! You need to create your own key if you are cloning this project
const { mongoKey } = require('./util/secrets/keys.js');

//? Import the routes
const feedRoutes = require('./routes/routes');

//? Initialize the app
const app = express();
//? Define the port being used
const restPort = 8080;

//? Parse the JSON data sent in POST and PUT requests
app.use(parser.json());
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

//? Use the routes
app.use('/feed', feedRoutes);

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
