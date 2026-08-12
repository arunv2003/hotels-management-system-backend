import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "hotelsRoomType",
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },
    floor: {
      type: String,
    },
    status: {
      type: String,
      enum: ["Available", "Booked", "Maintenance", "Dirty"],
      default: "Available",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure room numbers are unique per hotel and room type
roomSchema.index({ hotelId: 1, roomType: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model("Room", roomSchema);
