// backend/middleware/uploadProductImages.js
const multer = require("multer");
const cloudinary = require("../config/cloudinary");

// Use in-memory storage; we don't want to write to Render disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Expect 1 mainImage + many galleryImages
const multerFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "galleryImages", maxCount: 10 },
]);

// Helper: upload a single file buffer to Cloudinary
function uploadBufferToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const options = {
      folder,
      // You can add more options here (e.g. public_id) if you want
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (err, result) => {
        if (err) return reject(err);
        resolve(result.secure_url); // we only care about URL
      }
    );

    uploadStream.end(file.buffer);
  });
}

// Middleware: first run multer, then upload to Cloudinary,
// then attach the URLs onto req for the controller to use.
async function uploadProductImages(req, res, next) {
  multerFields(req, res, async (err) => {
    if (err) {
      console.error("[UPLOAD] Multer error:", err);
      return res
        .status(400)
        .json({ message: err.message || "Image upload failed" });
    }

    try {
      const files = req.files || {};
      const folder = process.env.CLOUDINARY_FOLDER || "tradepointmalawi";

      let mainImageUrl = null;
      let galleryImageUrls = [];

      // Upload main image if present
      if (files.mainImage && files.mainImage.length > 0) {
        const file = files.mainImage[0];
        mainImageUrl = await uploadBufferToCloudinary(file, folder);
      }

      // Upload gallery images if present
      if (files.galleryImages && files.galleryImages.length > 0) {
        galleryImageUrls = await Promise.all(
          files.galleryImages.map((file) =>
            uploadBufferToCloudinary(file, folder)
          )
        );
      }

      // Attach Cloudinary URLs to req for the controller
      req.cloudinaryImages = {
        mainImageUrl,
        galleryImageUrls,
      };

      next();
    } catch (uploadErr) {
      console.error("[UPLOAD] Cloudinary upload error:", uploadErr);
      return res
        .status(500)
        .json({ message: "Failed to upload images to Cloudinary" });
    }
  });
}

module.exports = uploadProductImages;
