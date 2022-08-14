//? Import express to create a controller
const express = require('express');
//? Import validation
const { body } = require('express-validator');

//? Import the authentication controller
const authController = require('../controllers/authenticationController.js');

//? Create a router for the posts
const router = express.Router();

//? Routing to create a new user account
router.put(
	//? Handling PUT requests to domain + /auth/register
	'/register',
	//? Validate data with express-validator
	[
		//? Check if email is valid
		body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
		//? Checks if password is at least 5 chars long after trimming
		body('password').trim().isLength({ min: 5 }),
		//? Checks for any name
		body('name').trim().not().isEmpty(),
	],
	authController.register
);

//? Handles requests to login at domain + /auth/authenticate
router.post(
	'/authenticate',
	//? Validate data with express-validator
	[
		//? Check if email is valid
		body('email').isEmail().withMessage('Please enter a valid email.').normalizeEmail(),
		//? Checks if password is at least 5 chars long after trimming
		body('password').trim().isLength({ min: 5 }),
	],
	authController.authentication
);

//? Export back to app.js
module.exports = router;
