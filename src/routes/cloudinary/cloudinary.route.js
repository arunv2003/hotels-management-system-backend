import express from "express";

import { upload } from "../../controllers/cloudinary/cloudinary.js";
import {
  uploadMultipleController,
  uploadSingleController,
  deleteImageController,
} from "../../controllers/cloudinary/cloudinary.controller.js";

const router = express.Router();

router.route("/upload").post(upload.single("file"), uploadSingleController);
router
  .route("/upload-multiple")
  .post(upload.array("files", 10), uploadMultipleController);

router.route("/delete").delete(deleteImageController);

export default router;
