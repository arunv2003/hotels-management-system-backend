import express from "express";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";
import {
  createPlans,
  deletePlan,
  getAllActivePlans,
  getAllPlans,
  getPlanById,
  makePopular,
  updatePlan,
} from "../../../controllers/saas/plans/plans.controller.js";

const router = express.Router();

router.route("/create-plans").post(verifyToken, createPlans);
router.route("/all-plans").get(verifyToken, getAllPlans);
router.route("/all-active-plans").get(verifyToken, getAllActivePlans);
router.route("/plans/:id").get(verifyToken, getPlanById);
router.route("/plans/:id").put(verifyToken, updatePlan);
router.route("/plans/:id").delete(verifyToken, deletePlan);
router.route("/make-popular/:id").patch(verifyToken, makePopular);

export default router;
