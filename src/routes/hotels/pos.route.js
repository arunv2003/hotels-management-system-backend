import express from "express";
import { verifyToken } from "../../common/middleware/authMiddleware.js";
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createPOSOrder,
  getPOSOrders,
  updateOrderStatus,
} from "../../controllers/hotels/pos.controller.js";

const router = express.Router();

// Menu items routes
router.route("/items").get(verifyToken, getMenuItems).post(verifyToken, createMenuItem);
router.route("/items/:id").put(verifyToken, updateMenuItem).delete(verifyToken, deleteMenuItem);

// POS order routes
router.route("/orders").get(verifyToken, getPOSOrders).post(verifyToken, createPOSOrder);
router.route("/orders/:id/status").patch(verifyToken, updateOrderStatus);

export default router;
