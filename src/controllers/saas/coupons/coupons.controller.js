import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { Coupon } from "../../../models/saas/coupons.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";

export const createCoupons = asyncHandler(async (req, res) => {
  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minPurchase = 0,
    usageLimit,
    usedCount = 0,
    status = "Active",
  } = req.body;

  if (!code) {
    throw new ApiError(400, "Please provide coupon code");
  }
  if (!discountType) {
    throw new ApiError(400, "Please provide discount type");
  }
  if (discountValue === undefined || discountValue === null) {
    throw new ApiError(400, "Please provide discount value");
  }
  if (!expiryDate) {
    throw new ApiError(400, "Please provide expiry date");
  }
  if (usageLimit === undefined || usageLimit === null) {
    throw new ApiError(400, "Please provide usage limit");
  }

  const couponExists = await Coupon.findOne({ code });
  if (couponExists) {
    throw new ApiError(400, "Coupon already exists");
  }

  const coupon = await Coupon.create({
    code,
    discountType,
    discountValue,
    expiryDate,
    minPurchase,
    usageLimit,
    usedCount,
    status,
  });
  return res
    .status(201)
    .json(new ApiResponse(201, coupon, "Coupon created successfully"));
});

export const getAllCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, coupons, "Coupons fetched successfully"));
});

export const getCouponById = asyncHandler(async (req, res) => {
  const couponId = req.params.id;
  if (!couponId) {
    throw new ApiError(400, "Please provide coupon id");
  }
  const coupon = await Coupon.findById(couponId);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon fetched successfully"));
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const couponId = req.params.id;
  if (!couponId) {
    throw new ApiError(400, "Please provide coupon id");
  }

  const couponExists = await Coupon.findById(couponId);
  if (!couponExists) {
    throw new ApiError(404, "Coupon not found");
  }

  const {
    code,
    discountType,
    discountValue,
    expiryDate,
    minPurchase,
    usageLimit,
    usedCount,
    status,
  } = req.body;

  if (code && code !== couponExists.code) {
    const codeTaken = await Coupon.findOne({ code, _id: { $ne: couponId } });
    if (codeTaken) {
      throw new ApiError(400, "Coupon code already exists");
    }
  }

  const updatedFields = {
    ...(code && { code }),
    ...(discountType && { discountType }),
    ...(discountValue !== undefined && { discountValue }),
    ...(expiryDate && { expiryDate }),
    ...(minPurchase !== undefined && { minPurchase }),
    ...(usageLimit !== undefined && { usageLimit }),
    ...(usedCount !== undefined && { usedCount }),
    ...(status && { status }),
  };

  const coupon = await Coupon.findByIdAndUpdate(
    couponId,
    updatedFields,
    {
      new: true,
    },
  );
  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon updated successfully"));
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const couponId = req.params.id;
  if (!couponId) {
    throw new ApiError(400, "Please provide coupon id");
  }
  const coupon = await Coupon.findByIdAndDelete(couponId);
  if (!coupon) {
    throw new ApiError(404, "Coupon not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, coupon, "Coupon deleted successfully"));
});
