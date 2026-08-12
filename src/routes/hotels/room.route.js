import express from "express";
import { verifyToken } from "../../common/middleware/authMiddleware.js";
import {
  createRoom,
  getRooms,
  getRoomTypesSummary,
  deleteRoom,
  updateRoom,
} from "../../controllers/hotels/room.controller.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createRoom);
router.get("/", getRooms);
router.get("/summary", getRoomTypesSummary);
router.put("/:id", updateRoom);
router.delete("/:id", deleteRoom);

export default router;
