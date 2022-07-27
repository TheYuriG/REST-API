//? Import Express and body-parser as NPM packages
const express = require('express');
const parser = require('body-parser');

//? Import the routes
const feedRoutes = require('./routes/routes');

//? Initialize the app
const app = express();
//? Define the port being used
const restPort = 8080;

//? Parse the JSON data sent in POST and PUT requests
app.use(parser.json());

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

//? Start the server
app.listen(restPort);
