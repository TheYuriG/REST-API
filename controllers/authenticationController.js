//? Require NPM packages
const { validationResult } = require('express-validator');
//? Import User model to deal with authentication
const User = require('../models/user.js');

//? Handles status fetch requests
exports.getStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		res.json(JSON.stringify(user));
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};

//? Deals with attempts to update the user status
exports.updateStatus = async (req, res, next) => {
	try {
		const user = await User.findById(req.userId);
		const updatedUser = user;
		updatedUser.status = req.body.status;
		const saveSuccess = await updatedUser.save();
		res.status(200).json({ message: 'Status updated successfully!' });
	} catch (err) {
		//? Forward the error to the express error handler
		if (!err.statusCode) {
			err.statusCode = 500;
		}
		next(err);
	}
};
