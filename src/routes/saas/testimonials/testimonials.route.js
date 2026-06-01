import express from "express";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";
import { routeAuth } from "../../../common/middleware/authorizeRoles.js";
import {
  createTestimonial,
  deleteTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
} from "../../../controllers/saas/testimonials/testimonials.controllers.js";

const router = express.Router();

router.route("/create-testimonials").post(verifyToken, createTestimonial);
router.route("/all-testimonials").get(verifyToken, getAllTestimonials);
router.route("/testimonial/:id").get(verifyToken, getTestimonialById);
router.route("/testimonial/:id").put(verifyToken, updateTestimonial);
router.route("/testimonial/:id").delete(verifyToken, deleteTestimonial);

export default router;
