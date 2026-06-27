const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const prefix = file.fieldname === 'avatar' ? 'avatar' :
                   file.fieldname === 'thumbnail' ? 'outfit' : Date.now().toString(36);
    const unique = prefix + '-' + Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '.png');
  }
});

const upload = multer({ storage, limits: { fileSize: 15 * 1024 * 1024 } });

module.exports = upload;
