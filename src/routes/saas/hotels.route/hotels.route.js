import express from "express";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";
import {
  registerHotel,
  getAllHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  toggleHotelStatus,
} from "../../../controllers/saas/hotels/hotels.controller.js";

const router = express.Router();

router.route("/register").post(registerHotel);

router.route("/all").get(verifyToken, getAllHotels);
router.route("/:id").get(verifyToken, getHotelById);
router.route("/:id").put(verifyToken, updateHotel);
router.route("/:id").delete(verifyToken, deleteHotel);
router.route("/:id/toggle-status").patch(verifyToken, toggleHotelStatus);

export default router;
