//? Import express to create a controller
const express = require('express');
//? Import validation
const { body } = require('express-validator');

//? Import the posts feed controller
const feedController = require('../controllers/controller.js');

//? Create a router for the posts
const router = express.Router();

//? Load posts stored in the server
router.get('/posts', feedController.getPosts);

//? Create a new post and save it in the server
router.post(
	'/post',
	//? Validate data before passing to the new post controller
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	feedController.postNewPost
);

//? Post controller for the page that displays information about a single post
router.get('/post/:postId', feedController.getSinglePostDetail);

//? Put controller to edit posts
router.put(
	'/post/:postId',
	//? Validate data before passing to the edit post controller
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	feedController.updatePost
);

//? Export back to app.js
module.exports = router;
