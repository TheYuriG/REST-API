//? Import express to create a controller
const express = require('express');

//? Import the posts feed controller
const feedController = require('../controllers/controller.js');

//? Create a router for the posts
const router = express.Router();

//? Load posts stored in the server
router.get('/posts', feedController.getPosts);

//? Create a new post and save it in the server
router.post('/post', feedController.postNewPost);

//? Export back to app.js
module.exports = router;
