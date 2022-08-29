//? Import encryption and validation NPM packages
const bcrypt = require('bcryptjs');
const validator = require('validator');

//? Import data models
const User = require('../models/user.js');
const Post = require('../models/post.js');

//? Export functions to be used by GraphQL resolver
module.exports = {
	//? Function to create an user on the database when user accesses
	//? '/signup' and sends a valid form
	createUser: async function ({ userInput: { name, password, email } }, req) {
		//? Array of validation errors
		const validationErrors = [];
		//? Validate user data before attempting any database access
		if (!validator.isEmail(email)) {
			validationErrors.push({ message: 'E-Mail is invalid.' });
		}
		if (validator.isEmpty(password) || !validator.isLength(password, { min: 5 })) {
			validationErrors.push({ message: 'Please provide a valid password.' });
		}
		if (validator.isEmpty(name) || !validator.isLength(name, { min: 5 })) {
			validationErrors.push({ message: 'Please provide a valid name.' });
		}
		if (validationErrors.length > 0) {
			const invalidInputError = new Error('Invalid input.');
			throw invalidInputError;
		}

		//? First we check if an user already exists with this email
		const existingUser = await User.findOne({ email: email });
		//? If we found an user, throw an error
		if (existingUser) {
			const error = new Error('User already exists!');
			throw error;
		}

		//? If there is no user with that email, hash the password they gave us
		const hashedPassword = await bcrypt.hash(password, 12);

		//? Create a new user with the data they sent and the hashed password
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name,
		});
		//? Save this new user to the database
		const savedUser = await user.save();

		//? Return to GraphQL the data it needs to separate and send to the client
		return { ...savedUser._doc, _id: savedUser._id.toString() };
	},
};
