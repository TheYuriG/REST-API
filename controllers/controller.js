//? Handles requests to website/feed/posts and returns JSON data
exports.getPosts = (req, res, next) => {
	//? Set the response status as 200 and return posts data
	res.status(200).json({
		posts: [{ title: 'First Post', content: 'This is the content body for the first post' }],
	});
};
