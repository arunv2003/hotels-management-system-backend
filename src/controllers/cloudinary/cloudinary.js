import dotenv from "dotenv";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});



const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, 
  },
});

// allowed folders
const allowedFolders = [
  "ownerProfileImages",
  "hotelsImages",
  "employeeDocument",
  "employeeProfileImage",
  "hotelsStaffProfileImage",
  "hotelDocumentImage",
  "hotelsRoomsImage",
  "hotelsStaffDocumentImage",
  "logo",
  "hotel-logos",
  "hotel-images",
  "others",
];

export const uploadImage = async (file, folderName = "others") => {
  console.log("Uploading file to Cloudinary:", {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    folderName,
  });
  
  return new Promise((resolve, reject) => {
    const finalFolder = allowedFolders.includes(folderName)
      ? folderName
      : "others";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: finalFolder,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return reject(
            new Error(error.message || "Cloudinary upload failed")
          );
        }

        if (!result) {
          return reject(
            new Error("Cloudinary upload result is undefined")
          );
        }

        resolve(result);
      }
    );

    console.log("Uploading file to Cloudinary with folder:", finalFolder);
    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};