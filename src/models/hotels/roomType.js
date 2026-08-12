import mongoose from "mongoose";

const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true, // E.g., Deluxe Suite, Executive Room, Standard Single
    },
    description: {
      type: String,
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    extraBedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxOccupancy: {
      type: Number,
      required: true,
      default: 2,
    },
    maxAdults: {
      type: Number,
      required: true,
      default: 2,
    },
    maxChildren: {
      type: Number,
      default: 0,
    },
    amenities: [
      {
        type: String, // E.g., "Free Wi-Fi", "Mini Bar", "AC", "TV", "Bath Tub"
      },
    ],
    images: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

export const RoomType = mongoose.model("RoomType", roomTypeSchema);
