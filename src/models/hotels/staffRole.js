import mongoose from "mongoose";

const staffRoleSchema = new mongoose.Schema(
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
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    permissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "StaffPermission",
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure role names are unique per hotel
staffRoleSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const StaffRole = mongoose.model("StaffRole", staffRoleSchema);
