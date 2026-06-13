const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '../backend/.env' });

console.log('Credentials:');
console.log('NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('KEY:', process.env.CLOUDINARY_API_KEY);
console.log('SECRET:', process.env.CLOUDINARY_API_SECRET ? 'PRESENT' : 'MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 1x1 transparent pixel base64
const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

async function testUpload() {
  try {
    const res = await cloudinary.uploader.upload(testImage, {
      folder: 'kdn_test'
    });
    console.log('SUCCESS!');
    console.log('URL:', res.secure_url);
  } catch (err) {
    console.error('FAILED:', err.message);
  }
}

testUpload();
