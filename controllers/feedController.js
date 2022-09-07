//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');
const User = require('../models/user.js');
//? Import the file deletion helper function
const { deleteImage } = require('../util/delete-image.js');

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

		//? Emit an event on the websocket
		io.getIO().emit('posts', { action: 'delete', post: postId });

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
