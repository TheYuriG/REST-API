//? Import express to create a controller
const express = require('express');

//? Import the posts feed controller
const feedController = require('../controllers/controller.js');

//? Create a router for the posts
const router = express.Router();

//? Assign page to controller
router.get('/posts', feedController.getPosts);
//! page loaded == website/feed/posts
//! "/feed" is defined at "app.use" in "app.js"
//! "/posts" is defined in this router above

//? Export back to app.js
module.exports = router;
