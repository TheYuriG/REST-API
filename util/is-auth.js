//? Require the JWT package to handle tokens within requests
const jwt = require('jsonwebtoken');
//? Import the JWT secret string
const { JWTsecret } = require('./secrets/keys');

module.exports = (req, res, next) => {
	//? Get the authorization from the request header
	const authorization = req.get('Authorization');
	//? If there is no authorization (is undefined), throw an error
	if (!authorization) {
		const error = new Error('Not Authenticated.');
		error.statusCode = 401;
		throw error;
	}

	//? Store the token to decode in the 'try' block
	//! 'Bearer ' is convention we add to token strings. We remove here as it's not relevant to the token data
	const token = authorization.replace('Bearer ', '');

	//? Create a soft variable to store the token after decoding with JWT
	let decodedToken;

	try {
		//? Try to decode the request token, if one was sent
		decodedToken = jwt.verify(token, JWTsecret);
	} catch (err) {
		//? If we fail to decode the token due to a bad or fake request, throw an error
		err.statusCode = 500;
		throw err;
	}

	//? If the token is invalid, throw an error
	if (!decodedToken) {
		const error = new Error('Invalid authentication token.');
		error.statusCode = 401;
		throw error;
	}

	//? If we decode the token successfully and the token is valid, proceed and
	//? store the user ID in the request to be used in CRUD post operations
	req.userId = decodedToken.userId;

	//? Forward to the next middleware after successfully validating
	next();
};
