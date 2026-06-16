import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    },
    rating: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    avatar: {
      type: String,
    },
    content: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const Testimonial = mongoose.model("Testimonial", testimonialSchema);
