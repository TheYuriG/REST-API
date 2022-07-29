//? Import express to create a controller
const express = require('express');
//? Import validation
const { body } = require('express-validator/check');

//? Import the posts feed controller
const feedController = require('../controllers/controller.js');

//? Create a router for the posts
const router = express.Router();

//? Load posts stored in the server
router.get('/posts', feedController.getPosts);

//? Create a new post and save it in the server
router.post(
	'/post',
	[body('title').trim().isLength({ min: 5 }), body('content').trim().isLength({ min: 5 })],
	feedController.postNewPost
);

//? Export back to app.js
module.exports = router;
