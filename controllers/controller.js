//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');
//? Import the file deletion helper function
const { deleteImage } = require('../util/delete-image.js');

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

//? Pulls additional data of a single post when clicking "View" on the feed
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

//? Opens a modal to update a post when clicking "Edit" in the feed
exports.updatePost = (req, res, next) => {
	//? Pull the errors (if any) from the post route
	const errors = validationResult(req);

	//? If there are errors, throw an error so the express error handler catches it
	if (!errors.isEmpty()) {
		const error = new Error('Validation error!');
		error.statusCode = 422;
		error.array = errors.array();
		throw error;
	}

	//? If no errors, proceed with the proper success response and
	//? store the new data on the database
	const postId = req.params.postId;
	const title = req.body.title;
	const content = req.body.content;
	let imageUrl = req.body.image;

	//? If a file was uploaded, update the file location for Windows
	if (req.file) {
		imageUrl = req.file.path.replace('\\', '/');
	}

	//? Basic check if there an image exists
	if (!imageUrl) {
		const error = new Error('No file selected.');
		error.statusCode = 422;
		throw error;
	}

	//? Look up on the database for the post being searched
	Post.findById(postId)
		.then((post) => {
			//! This will not find the post if the post was deleted between
			//! the page load and the "Edit" click
			if (!post) {
				const error = new Error("Post wasn't found on the database to be updated.");
				error.statusCode = 404;
				error.array = errors.array();
				throw error;
			}

			//? Update the database post with the newly provided data
			let updatedPost = post;
			post.title = title;
			post.content = content;

			//? Check if the image changed
			if (imageUrl !== post.imageUrl) {
				//? If the image changed, delete the old image from the server
				deleteImage(post.imageUrl);
				//? and update database with filePath to new image
				post.imageUrl = imageUrl;
			}

			//? Save the updated post on the database again
			return post.save();
		})
		.then((result) => {
			//? Return a success message to the client
			res.status(200).json({
				message: 'Post successfully updated on the database!',
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
