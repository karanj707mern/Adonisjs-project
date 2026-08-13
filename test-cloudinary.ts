require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.STORAGE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.STORAGE_CLOUDINARY_API_KEY,
  api_secret: process.env.STORAGE_CLOUDINARY_API_SECRET,
});

cloudinary.api.ping()
  .then(() => console.log('Cloudinary connection OK'))
  .catch((err: Error) => { 
    console.error('Cloudinary connection failed:', err.message); 
    process.exit(1); 
  });
