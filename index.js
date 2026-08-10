import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDB } from "./src/config/db.js";
import { errorHandler } from "./src/common/middleware/error.middleware.js";
//Cloudinary imports
import cloudinaryRoutes from "./src/routes/cloudinary/cloudinary.route.js";

//SAAS Imports
import authRoutes from "./src/routes/saas/auth/authRoutes.js";
import roleRoute from "./src/routes/saas/roles/roles.saas.routes.js";
import employeeRoute from "./src/routes/saas/employee/employee.route.js";
import plansRoute from "./src/routes/saas/plans/plans.saas.route.js";
import roomTypeRoutes from "./src/routes/saas/hotels.room.type/hotels.room.typs.js";
import hotelRoutes from "./src/routes/saas/hotels.route/hotels.route.js";
import testimonials from "./src/routes/saas/testimonials/testimonials.route.js";
import couponsRoutes from "./src/routes/saas/coupons/coupons.routes.js";
import announcementRoutes from "./src/routes/saas/announcement/announcement.route.js";



dotenv.config();
const PORT = process.env.PORT || 9000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());





//Cloudinary routes

app.use("/api/cloudinary", cloudinaryRoutes);
//SAAS routes 
app.use("/api/auth", authRoutes);
app.use("/api/roles", roleRoute);
app.use("/api/employees", employeeRoute);
app.use("/api/plans", plansRoute);
app.use('/api/room', roomTypeRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/testimonials', testimonials);
app.use('/api/coupons', couponsRoutes);
app.use('/api/announcement', announcementRoutes);



app.get("/", (req, res) => {
  res.send("Hello, World!");
});


app.use(errorHandler);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});


