//? Import mongoose to handle MongoDB
const mongoose = require('mongoose');
//? Import Schema from mongoose so we can define a data Schema for the users
const Schema = mongoose.Schema;

//? Create the data structure for posts
const userSchema = new Schema({
	email: { type: String, required: true },
	password: { type: String, required: true },
	name: { type: String, required: true },
	status: { type: String, default: 'I am new!' },
	posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }],
});

module.exports = mongoose.model('User', userSchema);
