//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');

//? Handles GET requests to website/feed/posts and returns JSON data
exports.getPosts = (req, res, next) => {
	//? Access the database to pull all posts
	//! Lacking pagination for now
	Post.find()
		.then((posts) => {
			//? Set the response status as 200 and return posts data
			res.status(200).json({
				message: 'All posts fetched',
				posts: posts,
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

//? Handles POST requests to create new posts at website/feed/post
exports.postNewPost = (req, res, next) => {
	//? Pull the errors (if any) from the post route
	const errors = validationResult(req);

	//? If there are errors, throw an error so the express error handler catches it
	if (!errors.isEmpty()) {
		const error = new Error('Validation error!');
		error.statusCode = 422;
		error.array = errors.array();
		throw error;
	}

	//? Check if a proper image was uploaded
	if (!req.file) {
		//? Throw an error if no proper image was sent
		const error = new Error('No image provided!');
		error.statusCode = 422;
		throw error;
	}

	//? If no errors, proceed with the proper success response and database storage
	const title = req.body.title;
	const content = req.body.content;
	const imageUrl = req.file.path.replace('\\', '/');

	//? Create a new post in the database following our Schema
	const post = new Post({
		title: title,
		content: content,
		imageUrl: imageUrl,
		creator: { name: 'You' },
	});

	//? Save this post in the database
	post.save()
		.then((result) => {
			res.status(201).json({
				message: 'Post created successfully!',
				post: result,
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

exports.getSinglePostDetail = (req, res, next) => {
	//? Fetch the post ID from the URL, it will be after "/post/"
	const postId = req.params.postId;

	//? Look up the database if there is an post with this same ID extracted
	Post.findById(postId)
		.then((post) => {
			//? If nothing was found, throw an error for the following catch block
			if (!post) {
				const error = new Error('Could not find post');
				error.statusCode = 404;
				throw error;
			}

			//? If something was found, return a success response
			res.status(200).json({
				message: 'Post Fetched',
				post: post,
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

// exports.updatePost = (req, res, next) => {
//     imageUrl = req.file.path.replace("\\","/");
// }
