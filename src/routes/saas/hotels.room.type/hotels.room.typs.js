import express from "express";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";
import { createHotelstype, deleteHotelstype, getHotelstype, updateHotelstype } from "../../../controllers/saas/hotelRoomType/hotels.room.type.js";

const router = express.Router();

router.route("/create-room-type").post(verifyToken, createHotelstype);
router.route("/all-room-type").get(verifyToken, getHotelstype);
router.route("/room-type/:_id").put(verifyToken, updateHotelstype);
router.route("/room-type/:_id").delete(verifyToken, deleteHotelstype);


export default router;
