import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
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
    category: {
      type: String,
      required: true,
      enum: ["Housekeeping", "Linen", "F&B", "Stationery", "Maintenance", "Other"],
      default: "Other",
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    minStockLevel: {
      type: Number,
      default: 5,
      min: 0,
    },
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs", // E.g. "pcs", "liters", "kg", "box", "meters"
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
