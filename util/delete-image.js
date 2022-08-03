//? Request the file system and path Node modules to delete the image from the server
const fs = require('fs');
const path = require('path');

const deleteImage = (filePath) => {
	filePath = path.join(__dirname, '..', filePath);
	fs.unlink(filePath, (err) => console.log(err));
};

module.exports.deleteImage = deleteImage;
