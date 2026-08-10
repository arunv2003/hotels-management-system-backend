import express from "express";
import {
  createAnnouncement,
  getAnnouncement,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  addClicks,
} from "../../../controllers/saas/announcement/announcement.controller.js";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";

const router = express.Router();

router.route("/create").post(verifyToken, createAnnouncement);
router.route("/get").get(verifyToken, getAnnouncement);
router.route("/get/:id").get(verifyToken, getAnnouncementById);
router.route("/update/:id").put(verifyToken, updateAnnouncement);
router.route("/delete/:id").delete(verifyToken, deleteAnnouncement);
router.route("/addClicks/:id").put(verifyToken, addClicks);

export default router;