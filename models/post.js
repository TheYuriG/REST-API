//? Import mongoose to handle MongoDB
const mongoose = require('mongoose');
//? Import Schema from mongoose so we can define a data Schema for the posts
const Schema = mongoose.Schema;

//? Create the data structure for posts
const postSchema = new Schema(
	{
		//? Post title
		title: {
			type: String,
			required: true,
		},
		//? Post image
		imageUrl: {
			type: String,
			required: true,
		},
		//? Post content (description)
		content: {
			type: String,
			required: true,
		},
		//? Post owner
		creator: {
			type: Object,
			required: true,
		},
	},
	//? Automatic creation of timestamps for creation and updating.
	//? This will be created on the background by the package
	{ timestamps: true }
);

//? Export this model so it can be used by other parts of our app
module.exports = mongoose.model('Post', postSchema);
