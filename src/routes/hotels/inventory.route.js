import express from "express";
import { verifyToken } from "../../common/middleware/authMiddleware.js";
import {
  getInventoryItems,
  getInventoryStats,
  getInventoryItemById,
  createInventoryItem,
  updateInventoryItem,
  adjustStock,
  deleteInventoryItem,
  getInventoryLogs,
} from "../../controllers/hotels/inventory.controller.js";

const router = express.Router();

// Inventory Analytics & Logs
router.route("/stats").get(verifyToken, getInventoryStats);
router.route("/logs").get(verifyToken, getInventoryLogs);

// Core Inventory Items CRUD
router
  .route("/")
  .get(verifyToken, getInventoryItems)
  .post(verifyToken, createInventoryItem);

router
  .route("/:id")
  .get(verifyToken, getInventoryItemById)
  .put(verifyToken, updateInventoryItem)
  .delete(verifyToken, deleteInventoryItem);

// Stock Adjustments (Stock In / Stock Out / Damaged / Consumed)
router.route("/:id/adjust-stock").post(verifyToken, adjustStock);

export default router;
