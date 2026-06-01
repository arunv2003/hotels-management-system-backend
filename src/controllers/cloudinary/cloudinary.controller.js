import { uploadImage } from "./cloudinary.js";
import { v2 as cloudinary } from "cloudinary"; // Add this import

export const uploadSingleController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    } // Removed the stray "ame" here
    const { folderName } = req.body;

    const result = await uploadImage(req.file, folderName);

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const uploadMultipleController = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const { folderName } = req.body;

    const uploadedImages = await Promise.all(
      req.files.map((file) => uploadImage(file, folderName)),
    );

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: uploadedImages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteImageController = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required",
      });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      return res.status(400).json({
        success: false,
        message: "Image delete failed",
        data: result,
      });
    }

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};