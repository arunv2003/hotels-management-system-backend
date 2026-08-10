import express from "express";
import {
  createCoupons,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} from "../../../controllers/saas/coupons/coupons.controller.js";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";

const router = express.Router();

router.route("/all_coupons").get(verifyToken, getAllCoupons);
router.route("/create").post(verifyToken, createCoupons);
router.route("/update_coupon/:id").put(verifyToken, updateCoupon);
router.route("/get_coupon/:id").get(verifyToken, getCouponById);
router.route("/delete_coupon/:id").delete(verifyToken, deleteCoupon);

export default router;
