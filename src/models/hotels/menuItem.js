import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
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
    },
    category: {
      type: String,
      required: true,
      enum: ["Starters", "Main Course", "Beverages", "Desserts", "Breads", "Soups", "Salads", "Other"],
      default: "Other",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isVeg: {
      type: Boolean,
      default: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
