//? Handles GET requests to website/feed/posts and returns JSON data
exports.getPosts = (req, res, next) => {
	//? Set the response status as 200 and return posts data
	res.status(200).json({
		posts: [{ title: 'First Post', content: 'This is the content body for the first post' }],
	});
};

//? Handles POST requests to create new posts at website/feed/post
exports.postNewPost = (req, res, next) => {
	// TODO Validate content before storing data
	const title = req.body.title;
	const content = req.body.content;
	// TODO Create post in database and then return a response to the user
	res.status(201).json({
		message: 'Post created successfully!',
		post: { id: new Date().toISOString(), title: title, content: content },
	});
};
