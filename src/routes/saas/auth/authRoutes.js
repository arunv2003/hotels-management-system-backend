import express from "express";
import { loginSuperAdmin, logoutUser, refreshAccessToken } from "../../../controllers/saas/auth/authController.js";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";

const router = express.Router();

router.post("/superadmin/login", loginSuperAdmin);
router.post("/login", loginSuperAdmin);
router.post("/logout", verifyToken, logoutUser);
router.post("/refresh-token", refreshAccessToken);

export default router;
