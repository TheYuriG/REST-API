//? Import encryption and validation NPM packages
const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');

//? Import data models
const User = require('../models/user.js');
const Post = require('../models/post.js');

//? Import the JWT secret string
const { JWTsecret } = require('../util/secrets/keys');

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

		//? If we have any validation errors, throw the error
		if (validationErrors.length > 0) {
			//? Name the error
			const invalidInputError = new Error('Invalid input.');
			//? Attach all validation errors to the thrown error
			validationErrors.data = validationErrors;
			//? Change the status code to Unprocessable Entity
			validationErrors.statusCode = 422;
			//? and finally throw it
			throw invalidInputError;
		}

		//? First we check if an user already exists with this email
		const existingUser = await User.findOne({ email: email });
		//? If we found an user, throw an error
		if (existingUser) {
			const error = new Error('User already exists!');
			error.statusCode = 409;
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
	authenticate: async function ({ email, password }) {
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

		//? If an user was found, we can use this user after comparing the
		//? provided and stored passwords without making another
		//? request to the database
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
			{ email: user.email, userId: user._id.toString() },
			//? Secret string to increase security
			//! Needs to be manually created if importing this project
			JWTsecret,
			//? Set expiry date. The frontend will logoff in 1h by default
			{ expiresIn: '1h' }
		);

		//? Return the JWT created above and the user's ID
		return {
			token: token,
			userId: user._id.toString(),
		};
	},
	createPost: async function ({ postInput: { title, content, imageUrl } }, req) {
		//? Check if the user is authenticated by verifying if a proper token
		//? string was passed with the request and processed by "./util/is-auth.js"
		if (!req.isAuth) {
			const error = new Error('Not authenticated!');
			error.statusCode = 401;
			throw error;
		}

		//? Array of validation errors
		const validationErrors = [];
		//? Validate post data before attempting any database access
		if (validator.isEmpty(content) || !validator.isLength(content, { min: 5 })) {
			validationErrors.push({ message: 'Please provide a valid description.' });
		}
		if (validator.isEmpty(title) || !validator.isLength(title, { min: 5 })) {
			validationErrors.push({ message: 'Please provide a valid title.' });
		}

		//? If we have any validation errors, throw the error
		if (validationErrors.length > 0) {
			//? Name the error
			const invalidInputError = new Error('Invalid input.');
			//? Attach all validation errors to the thrown error
			validationErrors.data = validationErrors;
			//? Change the status code to Unprocessable Entity
			validationErrors.code = 422;
			//? and finally throw it
			throw invalidInputError;
		}

		// //? Check if a proper image was uploaded
		// if (!req.file) {
		// 	//? Throw an error if no proper image was sent
		// 	const error = new Error('No image provided!');
		// 	error.statusCode = 422;
		// 	throw error;
		// }
		// const imageUrl = req.file.path.replace('\\', '/');

		// //? After validating the post information, fetch the user
		const user = await User.findById(req.userId);

		//? Check if we found a valid user and, if not, throw an error
		if (!user) {
			//? Name the error
			const invalidUserError = new Error('Invalid user.');
			//? Change the status code to Unauthenticated
			invalidUserError.code = 401;
			//? and finally throw it
			throw invalidUserError;
		}

		//? Create a new post in the database following our Schema
		const post = new Post({
			title: title,
			content: content,
			imageUrl: imageUrl,
			creator: user._id, //? We store the logged ID in the request using the 'is-auth.js' middleware
		});

		//? Save this post in the database
		const savedPost = await post.save();

		//? Once you have the user, add this post to the user's posts on the database
		user.posts.push(post);
		await user.save();

		return {
			...savedPost._doc,
			_id: savedPost._id.toString(),
			creator: user,
			createdAt: savedPost.createdAt.toISOString(),
			updatedAt: savedPost.updatedAt.toISOString(),
		};
	},
	posts: async function ({ page }, req) {
		//? Check if the user is authenticated by verifying if a proper token
		//? string was passed with the request and processed by "./util/is-auth.js"
		// if (!req.isAuth) {
		// 	const error = new Error('Not authenticated!');
		// 	error.statusCode = 401;
		// 	throw error;
		// }

		//? Pull the page number to work with proper pagination
		const currentPage = page || 1;
		//? Sets the limit of items to be displayed per page
		const postLimitPerPage = 10;

		try {
			//? Query the database for the number of items total
			const totalPosts = await Post.find().countDocuments();

			//? Access the database to pull all posts
			const posts = await Post.find()
				//? Add information about the post creator, so we can have their name
				.populate('creator')
				//? Sort posts by newest to oldest
				.sort({ createdAt: -1 })
				//? Pull only posts within the range of the page given
				.skip((currentPage - 1) * postLimitPerPage)
				//? Pull only as many posts as limited to single page
				.limit(postLimitPerPage);

			//? Return the relevant data to GraphQL
			return {
				//? Return all posts within the range, while modifying some data
				//? that GraphQL is unable to understand
				posts: posts.map((singlePost) => {
					return {
						//? Return all other information not described below
						...singlePost._doc,
						//? GraphQL can't understand what is a Mongo ID, so convert
						//? that to a string before returning through GraphQL
						_id: singlePost._id.toString(),
						//? GraphQL can't understand a javascript time object, so convert both
						//? the "createdAt" and "updatedAt" fields to an ISO String
						createdAt: singlePost.createdAt.toISOString(),
						updatedAt: singlePost.updatedAt.toISOString(),
					};
				}),
				totalPosts: totalPosts,
			};
		} catch (err) {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		}
	},
};
