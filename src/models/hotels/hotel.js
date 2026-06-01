import mongoose from "mongoose";

const hotelSchema = new mongoose.Schema(
  {
    ownerName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    starRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "India",
    },
    pincode: {
      type: String,
      required: true,
    },
    logo: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    checkInTime: {
      type: String,
      default: "12:00 PM",
    },
    checkOutTime: {
      type: String,
      default: "11:00 AM",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Hotel = mongoose.model("Hotel", hotelSchema);
