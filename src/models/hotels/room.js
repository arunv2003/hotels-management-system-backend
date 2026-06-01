import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
    },
    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RoomType",
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

// Ensure room numbers are unique per branch/hotel
roomSchema.index({ hotelId: 1, branchId: 1, roomNumber: 1 }, { unique: true });

export const Room = mongoose.model("Room", roomSchema);
