import express from "express";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";
import { routeAuth } from "../../../common/middleware/authorizeRoles.js";
import {
  createRole,
  getAllRoles,
  getRoleById,
  updateRole,
  deleteRole,
} from "../../../controllers/saas/roles/roles.saas.controllers.js";

const router = express.Router();

router.route("/create-role").post(verifyToken, createRole);
router.route("/all-roles").get(verifyToken, getAllRoles);
router.route("/role/:id").get(verifyToken, getRoleById);
router.route("/role/:id").put(verifyToken, updateRole);
router.route("/role/:id").delete(verifyToken, deleteRole);

export default router;
