import mongoose from "mongoose";

const ALLOWED_PERMISSIONS = ["view", "add", "edit", "delete", "global_view"];

const rolesSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    permissions: {
      type: Map,

      of: {
        type: [String],
        enum: ALLOWED_PERMISSIONS,
      },

      default: {},
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Role = mongoose.model("Role", rolesSchema);
