//? Require NPM packages
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
//? Import User model to deal with authentication
const User = require('../models/user.js');
//? Import the JWT secret string
const { JWTsecret } = require('../util/secrets/keys');

//? Handles PUT requests to '/auth/register'
exports.register = async (req, res, next) => {
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
	try {
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name,
		});
		const savedUser = await user.save();
		res.status(201).json({
			message: 'User created!',
			userId: savedUser._id,
		});
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Handles POST requests to '/auth/authenticate'
exports.authentication = async (req, res, next) => {
	//? Pull email and password from request body
	const email = req.body.email;
	const password = req.body.password;
	//? Create a temp variable to store the user object returned from a
	//? database check using the email
	let loadedUser;

	try {
		//? Look up if there is an user with the provided email
		const user = await User.findOne({ email: email });
		//? If the network connection to MongoDB works
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
		const isEqual = await bcrypt.compare(password, user.password);
		//? If bcrypt returns that the passwords do not match, throw an error
		if (!isEqual) {
			const error = new Error('Passwords do not match.');
			error.statusCode = 401;
			throw error;
		}

		//? If the passwords match, the IF block above gets skipped and
		//? we authenticate the user by creating their JSON Web Token
		const token = jwt.sign(
			//? Data to encrypt
			{ email: loadedUser.email, userId: loadedUser._id.toString() },
			//? Secret string to increase security
			//! Needs to be manually created if importing this project
			JWTsecret,
			//? Set expiry date. The frontend will logoff in 1h by default
			{ expiresIn: '1h' }
		);

		//? Return a success response and attach the JWT created above
		res.status(200).json({
			token: token,
			userId: loadedUser._id.toString(),
		});
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Handles status fetch requests
exports.getStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		res.json(JSON.stringify(user));
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Deals with attempts to update the user status
exports.updateStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		const updatedUser = user;
		updatedUser.status = req.body.status;
		const saveSuccess = await updatedUser.save();
		res.status(200).json({ message: 'Status updated successfully!' });
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
