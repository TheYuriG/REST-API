//? Request the file system and path Node modules to delete the image from the server
const fs = require('fs');
const path = require('path');

const deleteImage = (filePath) => {
	//? Construct the path to the file in a way the operating system understands
	const updatedFilePath = path.join(__dirname, '..', filePath);
	//? Delete the file at the specified path
	fs.unlink(updatedFilePath, (err) => {
		//? Check for errors and, if any, log them to the console
		if (err) {
			console.log(err);
		}
	});
};

module.exports.deleteImage = deleteImage;
