//? Import express to create a controller
const express = require('express');
//? Import validation
const { body } = require('express-validator');
//? Import authentication middleware to handle validation of JWT tokens
const isAuth = require('../util/is-auth.js');

//? Import the posts feed controller
const feedController = require('../controllers/feedController.js');

//? Create a router for the posts
const router = express.Router();

//? Load posts stored in the server
router.get('/posts', isAuth, feedController.getPosts);

//? Create a new post and save it in the server
router.post(
	'/post',
	isAuth,
	//? Validate data before passing to the new post controller
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	feedController.postNewPost
);

//? Post controller for the page that displays information about a single post
router.get('/post/:postId', isAuth, feedController.getSinglePostDetail);

//? Put controller to edit posts
router.put(
	'/post/:postId',
	isAuth,
	//? Validate data before passing to the edit post controller
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	feedController.updatePost
);

//? Delete controller to delete posts
router.delete('/post/:postId', isAuth, feedController.deletePost);

//? Export back to app.js
module.exports = router;
