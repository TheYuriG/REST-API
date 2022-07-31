const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

//? Handles how uploaded images would be stored and named on the server after being filtered by multer
const multerFileStorage = multer.diskStorage({
	//? Where the image would be saved on the server disk
	destination: (req, file, callbackToFileLocation) => {
		callbackToFileLocation(null, 'images');
	},
	//? How the file would be named on the server disk
	filename: (req, file, callbackToFileName) => {
		callbackToFileName(null, uuidv4());
	},
});

//? Filters which file types are accepted by multer to be uploaded to server disk
const multerFileFilter = (req, file, callbackFileFilter) => {
	//? Checks if the file uploaded is of type PNG/JPG/JPEG
	if (
		file.mimetype === 'image/png' ||
		file.mimetype === 'image/jpg' ||
		file.mimetype === 'image/jpeg'
	) {
		//? Returns true and accepts the file if the filetype matches
		callbackFileFilter(null, true);
	} else {
		//? Returns false and rejects file due to unmatched filetype
		callbackFileFilter(null, false);
	}
};

module.exports.multerParser = multer({
	storage: multerFileStorage,
	fileFilter: multerFileFilter,
}).single('image');
