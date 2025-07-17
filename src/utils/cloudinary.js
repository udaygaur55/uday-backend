import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Upload local file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto"
    });

    console.log("File uploaded on Cloudinary:", response.url);
    return response;
  } catch (error) {
    console.error("Upload failed:", error);
    fs.unlinkSync(localFilePath); // remove the failed local file
    return null;
  }
};

// ✅ Upload image from remote URL (optional demo)
const uploadRemoteImage = async () => {
  try {
    const result = await cloudinary.uploader.upload(
      "https://img.freepik.com/premium-photo/cool-cat-wearing-pink-sunglasses-with-neon-light-background_514761-16858.jpg",
      { public_id: "olympic_flag", resource_type: "image" }
    );
    fs.unlinkSync(localFilePath)
    
    // console.log("Remote image uploaded:", result.secure_url);
  } catch (error) {
    // console.error("Remote upload failed:", error);
  }
};

// 🔁 Optional: call this once to test
// await uploadRemoteImage();

export { uploadOnCloudinary };
