const fs = require('fs');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const env = require('../config/env');

/**
 * Upload single image file to Cloudinary with fallback to local path.
 */
const uploadImage = async (file, folder = 'products') => {
  if (!file) return null;

  // If Cloudinary is configured
  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: `appecom/${folder}`,
        resource_type: 'image',
      });

      // Remove local temp file after upload
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      console.error('[Cloudinary Service] Upload error, falling back to local file:', error.message);
    }
  }

  // Fallback to local storage URL
  const localFileName = path.basename(file.path);
  const localUrl = `/uploads/${localFileName}`;
  return {
    url: localUrl,
    publicId: localFileName,
    isLocal: true,
  };
};

/**
 * Upload multiple image files.
 */
const uploadMultipleImages = async (files = [], folder = 'products') => {
  if (!files || files.length === 0) return [];
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
};

/**
 * Delete image from Cloudinary or local uploads folder.
 */
const deleteImage = async (publicId) => {
  if (!publicId) return;

  if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
    try {
      await cloudinary.uploader.destroy(publicId);
      return;
    } catch (error) {
      console.warn('[Cloudinary Service] Could not delete remote image:', error.message);
    }
  }

  // Check local file
  const localPath = path.join(__dirname, '../../uploads', publicId);
  if (fs.existsSync(localPath)) {
    try {
      fs.unlinkSync(localPath);
    } catch (err) {
      console.warn('[Cloudinary Service] Could not delete local file:', err.message);
    }
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};

