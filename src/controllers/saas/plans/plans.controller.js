import { ApiError } from "../../../common/utils/api.Errors.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";
import { Plan } from "../../../models/saas/plans.js";

export const createPlans = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    features,
    maxDailyBookings,
    maxStaff,
    halfYearlyPrice,
    yearlyPrice,
    status,
    trialDays,
  } = req.body;
  if (
    !name ||
    !halfYearlyPrice ||
    !yearlyPrice ||
    maxDailyBookings === undefined ||
    maxStaff === undefined
  ) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Name, half yearly price, yearly price, max daily bookings, and max staff are required",
        ),
      );
  }
  const findPlan = await Plan.findOne({ name: name });
  if (findPlan) {
    return res
      .status(400)
      .json(new ApiError(400, "Plan with this name already exists"));
  }
  const newPlan = await Plan.create({
    name,
    description,
    halfYearlyPrice,
    yearlyPrice,
    features,
    maxDailyBookings,
    maxStaff,
    status,
    trialDays,
  });
  res
    .status(201)
    .json(new ApiResponse(201, "Plan created successfully", newPlan));
});

export const getAllPlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find().sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(200, plans, "Plans retrieved successfully"));
});
export const getAllActivePlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ status: "Active" }).sort({ createdAt: -1 });
  res
    .status(200)
    .json(new ApiResponse(200, plans, "Plans retrieved successfully"));
});
export const makePopular = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const plan = await Plan.findById(id);
  if (!plan) {
    return res.status(404).json(new ApiError(404, "Plan not found"));
  }
  
  const existingPopularPlan = await Plan.findOne({ isPopular: true });
  if (existingPopularPlan && existingPopularPlan._id.toString() !== id) {
    existingPopularPlan.isPopular = false;
    await existingPopularPlan.save();
  }
  
  plan.isPopular = true;
  await plan.save();
  
  res.status(200).json(new ApiResponse(200, plan, "Plan marked as popular successfully"));
});

export const getPlanById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findById(id);
  if (!plan) {
    return res.status(404).json(new ApiError(404, "Plan not found"));
  }
  res
    .status(200)
    .json(new ApiResponse(200, "Plan retrieved successfully", plan));
});

export const updatePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    name,
    description,
    features,
    maxDailyBookings,
    maxStaff,
    halfYearlyPrice,
    yearlyPrice,
    status,
  } = req.body;
  if (
    !name ||
    !halfYearlyPrice ||
    !yearlyPrice ||
    maxDailyBookings === undefined ||
    maxStaff === undefined
  ) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Name, half yearly price, yearly price, max daily bookings, and max staff are required",
        ),
      );
  }
  if (maxDailyBookings === undefined || maxStaff === undefined) {
    return res
      .status(400)
      .json(new ApiError(400, "Max daily bookings and max staff are required"));
  }
  if (name) {
    const findPlan = await Plan.findOne({ name: name, _id: { $ne: id } });
    if (findPlan) {
      return res
        .status(400)
        .json(new ApiError(400, "Plan with this name already exists"));
    }
  }
  const plan = await Plan.findByIdAndUpdate(
    id,
    {
      name,
      description,
      features,
      maxDailyBookings,
      maxStaff,
      halfYearlyPrice,
      yearlyPrice,
      status,
    },
    { new: true },
  );

  if (!plan) {
    return res.status(404).json(new ApiError(404, "Plan not found"));
  }
  res.status(200).json(new ApiResponse(200, "Plan updated successfully", plan));
});

export const deletePlan = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const plan = await Plan.findByIdAndDelete(id);
  if (!plan) {
    return res.status(404).json(new ApiError(404, "Plan not found"));
  }
  res.status(200).json(new ApiResponse(200, "Plan deleted successfully", plan));
});
