const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(
  __dirname,
  "../uploads/job-descriptions"
);

// ==========================================
// CREATE DIRECTORY
// ==========================================

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// STORAGE
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(
      file.originalname
    );

    const safeName =
      path
        .basename(
          file.originalname,
          extension
        )
        .replace(/[^a-zA-Z0-9-_]/g, "-")
        .substring(0, 50);

    const uniqueName =
      `${safeName}-${Date.now()}-${Math.round(
        Math.random() * 1e9
      )}${extension}`;

    cb(null, uniqueName);
  },
});

// ==========================================
// FILE FILTER
// ==========================================

const fileFilter = function (
  req,
  file,
  cb
) {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed"
      )
    );
  }
};

// ==========================================
// MULTER
// ==========================================

const upload = multer({
  storage,

  fileFilter,

  limits: {
    files: 10,
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;