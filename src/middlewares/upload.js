const multer = require('multer');
const fs = require('fs');

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('Please upload only images.', false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdir('./uploads', (err) => {
      cb(null, './uploads');
    });
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-avatar-${file.originalname}`);
  },
});

var uploadFile = multer({ storage: storage, fileFilter: imageFilter });

module.exports = uploadFile;
