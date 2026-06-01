import mongoose from "mongoose";

const staffPermissionSchema = new mongoose.Schema(
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
    module: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure permission names are unique per hotel/tenant
staffPermissionSchema.index({ hotelId: 1, name: 1 }, { unique: true });

export const StaffPermission = mongoose.model("StaffPermission", staffPermissionSchema);
