//? Soft create the variable that will hold the websocket, before we export it
let io;

module.exports = {
	//? Creates a module function that will start the websocket
	//? Only argument is the express server
	init: (httpServer) => {
		//? Lazy load the NPM package and pass the express server as argument
		io = require('socket.io')(httpServer, {
			//? CORS policy explicit information
			cors: {
				origin: 'https://localhost:3000',
				credentials: true,
			},
		});
		//? Return the initialized websocket to 'app.js'
		return io;
	},
	//? Initializes a function that will get the initialized websocket
	//! This will only be used inside a controller, after the server already runs
	getIO: () => {
		//? Check if the websocket was initialized yet, just in case
		if (!io) {
			//? Throw an error if, for some God-forsaken reason, the websocket
			//? wasn't initialized yet
			throw new Error('Socket.io not initialized!');
		}
		//? Send back the websocket to whatever file was asking for it
		return io;
	},
};
