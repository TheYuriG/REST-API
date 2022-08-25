const bcrypt = require('bcryptjs');
const User = require('../models/user.js');

module.exports = {
	createUser: async function ({ userInput: { name, password, email } }, req) {
		const existingUser = await User.findOne({ email: email });
		if (existingUser) {
			const error = new Error('User already exists!');
			throw error;
		}
		const hashedPassword = await bcrypt.hash(password, 12);
		const user = new User({
			email: email,
			password: hashedPassword,
			name: name,
		});
		const savedUser = await user.save();
		return { ...savedUser._doc, _id: savedUser._id.toString() };
	},
};
