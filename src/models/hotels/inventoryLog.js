import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
      index: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    department: {
      type: String,
      required: true,
      default: "Housekeeping",
    },
    type: {
      type: String,
      required: true,
      enum: ["Stock In", "Stock Out", "Adjustment", "Damaged", "Consumed", "Returned", "Initial"],
      default: "Adjustment",
    },
    quantityChanged: {
      type: Number,
      required: true,
    },
    previousQuantity: {
      type: Number,
      required: true,
    },
    newQuantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "pcs",
    },
    reason: {
      type: String,
      default: "",
    },
    reference: {
      type: String,
      default: "", // E.g., PO Number, Room Number, Order ID
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    performedByName: {
      type: String,
      default: "Admin / Staff",
    },
  },
  { timestamps: true }
);

export const InventoryLog = mongoose.model("InventoryLog", inventoryLogSchema);
