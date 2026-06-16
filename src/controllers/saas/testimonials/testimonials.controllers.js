import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import {Testimonial} from "../../../models/saas/testimonial.js"

export const createTestimonial = asyncHandler(async (req, res) => {
  const { author, role, hotel, rating, status, content, avatar } = req.body;
  console.log(req.body)
  console.log(author, role, hotel, rating, status, content, avatar,"sasasasasas")

  if (!author || !role || !hotel || !rating || !content || !status) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Author, role, hotel, rating, review and status are required",
        ),
      );
  }
  const findTestimonial = await Testimonial.findOne({
    author: author,
    hotel: hotel,
  });
  if (findTestimonial) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "You have already submitted a testimonial for this hotel",
        ),
      );
  }
  const newTestimonial = await Testimonial.create({
    author,
    role,
    hotel,
    rating,
    status,
    content,
    avatar,
  });
  return res
    .status(201)
    .json(
      new ApiResponse(201, "Testimonial created successfully", newTestimonial),
    );
});

export const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find().populate("hotel", "name");
  return res
    .status(200)
    .json(
      new ApiResponse(200, testimonials,"Testimonials retrieved successfully")
    );
});

export const getTestimonialById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json(new ApiError(400, "Testimonial ID is required"));
  }
  const testimonial = await Testimonial.findById(id).populate("hotel", "name");
  if (!testimonial) {
    return res.status(404).json(new ApiError(404, "Testimonial not found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Testimonial retrieved successfully", testimonial),
    );
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { author, role, hotel, rating, status, content, image } = req.body;

  if (!author || !role || !hotel || !rating || !content || !status) {
    return res
      .status(400)
      .json(
        new ApiError(
          400,
          "Author, role, hotel, rating, content and status are required",
        ),
      );
  }

  const testimonial = await Testimonial.findByIdAndUpdate(
    id,
    {
      author,
      role,
      hotel,
      rating,
      status,
      content,
      avatar,
    },
    { new: true },
  );
  if (!testimonial) {
    return res.status(404).json(new ApiError(404, "Testimonial not found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Testimonial updated successfully", testimonial),
    );
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res
      .status(400)
      .json(new ApiError(400, "Testimonial ID is required"));
  }
  const testimonial = await Testimonial.findByIdAndDelete(id);
  if (!testimonial) {
    return res.status(404).json(new ApiError(404, "Testimonial not found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Testimonial deleted successfully", testimonial),
    );
});
