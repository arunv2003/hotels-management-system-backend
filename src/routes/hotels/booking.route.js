import express from "express";
import { verifyToken } from "../../common/middleware/authMiddleware.js";
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} from "../../controllers/hotels/boooking.controller.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
