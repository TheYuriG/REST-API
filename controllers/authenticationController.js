//? Require NPM packages
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

//? Import User model to deal with authentication
const User = require('../models/user.js');

//? Handles PUT requests to '/auth/register'
exports.register = (req, res, next) => {
	const validationErrors = validationResult(req);
	if (!validationErrors.isEmpty()) {
		const error = new Error('Validation failed.');
		error.statusCode = 422;
		error.allErrors = validationErrors.array();
		throw error;
	}
	const email = req.body.email;
	const name = req.body.name;
	const password = req.body.password;
	bcrypt
		.hash(password, 12)
		.then((hashedPassword) => {
			const user = new User({
				email: email,
				password: hashedPassword,
				name: name,
			});
			return user.save();
		})
		.then((result) => {
			res.status(201).json({
				message: 'User created!',
				userId: result._id,
			});
		})
		.catch((err) => {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

//? Handles POST requests to '/auth/authenticate'
exports.authentication = (req, res, next) => {
	//? Pull email and password from request body
	const email = req.body.email;
	const password = req.body.password;
	//? Create a temp variable to store the user object returned from a
	//? database check using the email
	let loadedUser;

	//? Look up if there is an user with the provided email
	User.findOne({ email: email })
		//? If the network connection to MongoDB works
		.then((user) => {
			//? Check if an user was found
			if (!user) {
				//? If no user was found, throw an error
				const error = new Error('An user with this email could not be found.');
				error.statusCode = 401;
				throw error;
			}

			//? If an user was found, the IF block above will be skipped
			//? so we have an user and store it on the temp variable we created
			//? then we can use this user after comparing the provided and stored
			//? passwords without making another request to the database
			loadedUser = user;

			//? Compare the provided and stored passwords
			return bcrypt.compare(password, user.password);
		})
		.then((isEqual) => {
			//? If bcrypt returns that the passwords do not match, throw an error
			if (!isEqual) {
				const error = new Error('Passwords do not match.');
				error.statusCode = 401;
				throw error;
			}

			//? If the passwords match, the IF block above gets skipped and
			//? we authenticate the user
			//! Install JWT and return that to the client to store
			// res.status(201).json({
			// 	message: 'User created!',
			// 	userId: result._id,
			// });
		})
		.catch((err) => {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};
