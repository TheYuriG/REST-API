//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');
const User = require('../models/user.js');
//? Import the file deletion helper function
const { deleteImage } = require('../util/delete-image.js');
//? Import Socket.IO websocket controller
const io = require('../util/socket.js');

//? Handles GET requests to website/feed/posts and returns JSON data
exports.getPosts = async (req, res, next) => {
	//? Pull the page number to work with proper pagination
	const currentPage = req.query.page || 1;
	//? Sets the limit of items to be displayed per page
	const postLimitPerPage = 10;

	try {
		//? Query the database for the number of items total
		const totalPosts = await Post.find().countDocuments();

		//? Access the database to pull all posts
		const posts = await Post.find()
			.populate('creator')
			.skip((currentPage - 1) * postLimitPerPage)
			.limit(postLimitPerPage);
		//? Set the response status as 200 and return posts data and
		//? the total number of posts so the frontend can properly paginate
		res.status(200).json({
			message: 'Posts fetched',
			posts: posts,
			totalItems: totalPosts,
		});
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Handles POST requests to create new posts at website/feed/post
exports.postNewPost = async (req, res, next) => {
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
		creator: req.userId, //? We store the logged ID in the request using the 'is-auth.js' middleware
	});

	try {
		//? Save this post in the database
		await post.save();

		//? After saving the post, fetch the user
		const user = await User.findById(req.userId);

		//? Once you have the user, add this post to the user's posts on the database
		user.posts.push(post);
		await user.save();

		//? Sends event to websocket so the clients will update their UI with the newly fetched data
		io.getIO().emit('posts', {
			action: 'create',
			post: { ...post._doc, creator: { _id: req.userId, name: user.name } },
		});

		//? After both operations are successful, return a success response to the client
		res.status(201).json({
			message: 'Post created successfully!',
			post: post,
			creator: { _id: user._id, name: user.name },
		});
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Pulls additional data of a single post when clicking "View" on the feed
exports.getSinglePostDetail = async (req, res, next) => {
	//? Fetch the post ID from the URL, it will be after "/post/"
	const postId = req.params.postId;

	try {
		//? Look up the database if there is an post with this same ID extracted
		const post = await Post.findById(postId).populate('creator');
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
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Opens a modal to update a post when clicking "Edit" in the feed
exports.updatePost = async (req, res, next) => {
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

	try {
		//? Look up on the database for the post being searched
		const post = await Post.findById(postId);
		//! This will not find the post if the post was deleted between
		//! the page load and the "Edit" click
		if (!post) {
			const error = new Error("Post wasn't found on the database to be updated.");
			error.statusCode = 404;
			error.array = errors.array();
			throw error;
		}

		//? Check if the person trying to edit the post is the
		//? same person who created it and fail the request if isn't
		if (post.creator.toString() !== req.userId) {
			const error = new Error('Not authorized!');
			error.statusCode = 403;
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
		const savedPost = await post.save();
		//? Return a success message to the client
		res.status(200).json({
			message: 'Post successfully updated on the database!',
			post: savedPost,
		});
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Delete the post, if the user has delete rights to it
exports.deletePost = async (req, res, next) => {
	//? Extract the post ID from the URL
	const postId = req.params.postId;

	try {
		//? Look up if this post actually exists and if the person has delete permissions for it
		const post = await Post.findById(postId);
		//? If no post was found, throw error
		if (!post) {
			const error = new Error('Could not find post to delete');
			error.statusCode = 404;
			throw error;
		}

		//? Check if the person trying to delete the post is the
		//? same person who created it and fail the request if isn't
		if (post?.creator.toString() !== req.userId) {
			const error = new Error('Not authorized!');
			error.statusCode = 403;
			throw error;
		}

		//? Searches and destroys this post on the database
		await Post.findByIdAndDelete(postId);
		//? Once the post was destroyed, we need to remove this post reference
		//? from the user's posts. First we fetch the user
		const user = await User.findById(req.userId);
		//? Then we remove the post reference from the 'posts' array inside
		//? the user entry on the database
		user.posts.pull(postId);
		//? then we save this user without the post reference
		await user.save();
		//? Finally delete the image from the server storage
		deleteImage(post.imageUrl);
		//? Return a success message to the user
		res.status(200).json({ message: 'Successful post deletion!' });
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
