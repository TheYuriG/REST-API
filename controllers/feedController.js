//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');
const User = require('../models/user.js');
//? Import the file deletion helper function
const { deleteImage } = require('../util/delete-image.js');

//? Handles status fetch requests
exports.getStatus = (req, res, next) => {
	User.findById(req.userId)
		.then((user) => {
			res.json(JSON.stringify(user));
		})
		.catch((err) => {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

//? Deals with attempts to update the user status
exports.updateStatus = (req, res, next) => {
	User.findById(req.userId)
		.then((user) => {
			const updatedUser = user;
			updatedUser.status = req.body.status;
			return updatedUser.save();
		})
		.then(() => {
			res.status(200).json({ message: 'Status updated successfully!' });
		})
		.catch((err) => {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};

//? Handles GET requests to website/feed/posts and returns JSON data
exports.getPosts = (req, res, next) => {
	//? Pull the page number to work with proper pagination
	const currentPage = req.query.page || 1;
	//? Sets the limit of items to be displayed per page
	const postLimitPerPage = 10;
	//? Soft store the total number of items to be later passed to the
	//? front end so it can know when to render the "Previous" and "Next" button
	let totalPosts;

	//? Query the database for the number of items total
	Post.find()
		.countDocuments()
		.then((count) => {
			//? Update the totalPosts variable to then pass that number to the frontend
			totalPosts = count;

			//? Access the database to pull all posts
			return Post.find()
				.skip((currentPage - 1) * postLimitPerPage)
				.limit(postLimitPerPage);
		})
		.then((posts) => {
			//? Set the response status as 200 and return posts data and
			//? the total number of posts so the frontend can properly paginate
			res.status(200).json({
				message: 'Posts fetched',
				posts: posts,
				totalItems: totalPosts,
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
	let creator;

	//? Create a new post in the database following our Schema
	const post = new Post({
		title: title,
		content: content,
		imageUrl: imageUrl,
		creator: req.userId, //? We store the logged ID in the request using the 'is-auth.js' middleware
	});

	//? Save this post in the database
	post.save()
		//? After saving the post, fetch the user
		.then(() => User.findById(req.userId))
		//? Once you have the user, add this post to the user's posts
		.then((user) => {
			creator = user;
			user.posts.push(post);
			return user.save();
		})
		//? After both operations are successful, return a success response to the client
		.then(() => {
			res.status(201).json({
				message: 'Post created successfully!',
				post: post,
				creator: { _id: creator._id, name: creator.name },
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

//? Delete the post, if the user has delete rights to it
exports.deletePost = (req, res, next) => {
	//? Extract the post ID from the URL
	const postId = req.params.postId;
	//? Temp store the imagePath so that we can delete the image only
	//? after the post was deleted in the database
	let imagePath;

	//? Look up if this post actually exists and if the person has delete permissions for it
	Post.findById(postId)
		.then((post) => {
			//? If no post was found, throw error
			if (!post) {
				const error = new Error('Could not find post to delete');
				error.statusCode = 404;
				throw error;
			}

			//? Check if the person trying to delete the post is the
			//? same person who created it and fail the request if isn't
			if (post.creator.toString() !== req.userId) {
				const error = new Error('Not authorized!');
				error.statusCode = 403;
				throw error;
			}

			//? Update the temp store image variable to delete the post after
			//? the findByIdAndDelete method (below) completes
			imagePath = post.imageUrl;

			//? Searches and destroys this post on the database
			return Post.findByIdAndDelete(postId);
		})
		.then(() => {
			//? Once the post was destroyed, we need to remove this post reference
			//? from the user's posts. First we fetch the user
			return User.findById(req.userId);
		})
		.then((user) => {
			//? Then we remove the post reference from the 'posts' array inside
			//? the user entry on the database
			user.posts.pull(postId);
			//? then we save this user without the post reference
			return user.save();
		})
		.then((result) => {
			//? Finally delete the image from the server storage
			deleteImage(imagePath);
			//? Return a success message to the user
			res.status(200).json({ message: 'Successful post deletion!' });
		})
		.catch((err) => {
			//? Forward the error to the express error handler
			if (!err.statusCode) {
				err.statusCode = 500;
			}
			next(err);
		});
};
