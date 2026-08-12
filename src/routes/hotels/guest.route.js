import express from "express";
import { verifyToken } from "../../common/middleware/authMiddleware.js";
import {
  getGuests,
  getGuestById,
  createGuest,
  updateGuest,
  deleteGuest,
} from "../../controllers/hotels/guest.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getGuests);
router.get("/:id", getGuestById);
router.post("/", createGuest);
router.put("/:id", updateGuest);
router.delete("/:id", deleteGuest);

export default router;
