//? Import validation to check if the routes are giving data errors
const { validationResult } = require('express-validator');
//? Import our MongoDB posts Schema
const Post = require('../models/post.js');

//? Handles GET requests to website/feed/posts and returns JSON data
exports.getPosts = (req, res, next) => {
	//? Set the response status as 200 and return posts data
	res.status(200).json({
		posts: [
			{
				_id: '1',
				title: 'First Post',
				content: 'This is the content body for the first post',
				imageUrl: 'images/farCry.jpg',
				creator: {
					name: 'You',
				},
				createdAt: new Date(),
			},
		],
	});
};

//? Handles POST requests to create new posts at website/feed/post
exports.postNewPost = (req, res, next) => {
	//? Pull the errors (if any) from the post route
	const errors = validationResult(req);

	//? If there are errors, return an error message response
	if (!errors.isEmpty()) {
		return res.status(422).json({
			message: 'Validation error!',
			errors: errors.array(),
		});
	}

	//? If no errors, proceed with the proper success response and database storage
	const title = req.body.title;
	const content = req.body.content;

	//? Create a new post in the database following our Schema
	const post = new Post({
		title: title,
		content: content,
		imageUrl: 'images/farCry.jpg',
		creator: { name: 'You' },
	});

	//? Save this post in the database
	post.save()
		.then((result) => {
			console.log(result);
			res.status(201).json({
				message: 'Post created successfully!',
				post: result,
			});
		})
		.catch((err) => console.log(err));
};
