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
