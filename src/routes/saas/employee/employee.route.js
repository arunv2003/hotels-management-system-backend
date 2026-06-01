import express from "express";
import { createEmployee, deleteEmployee, getAllEmployees, getEmployeeById, updateEmployee } from "../../../controllers/saas/employee/employee.controller.js";
import { verifyToken } from "../../../common/middleware/authMiddleware.js";


const router = express.Router();

router.route("/create-employee").post(verifyToken, createEmployee);
router.route("/get-all-employees").get(verifyToken, getAllEmployees);
router.route("/employee/:id").get(verifyToken, getEmployeeById);
router.route("/employee/:id").put(verifyToken, updateEmployee);
router.route("/employee/:id").delete(verifyToken, deleteEmployee);

export default router;
