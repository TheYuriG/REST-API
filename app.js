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

//? Use the routes
app.use('/feed', feedRoutes);

//? Start the server
app.listen(restPort);
