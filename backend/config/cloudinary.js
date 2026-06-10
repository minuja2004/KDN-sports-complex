const cloudinary = require('cloudinary').v2;

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('Cloudinary Service: Configured successfully.');
} else {
  console.log('Cloudinary Service: Credentials missing. Storing images in database directly.');
}

const uploadImage = async (base64Str) => {
  if (!isConfigured) return null;
  try {
    const uploadResponse = await cloudinary.uploader.upload(base64Str, {
      folder: 'kdn_sports_complex'
    });
    return uploadResponse.secure_url;
  } catch (err) {
    console.error('Cloudinary upload execution failed:', err.message);
    return null;
  }
};

module.exports = {
  uploadImage,
  isConfigured
};
