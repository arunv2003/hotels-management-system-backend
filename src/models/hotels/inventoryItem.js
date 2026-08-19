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
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    department: {
      type: String,
      required: true,
      enum: ["Housekeeping", "Restaurant", "Kitchen", "Linen", "Amenities", "Maintenance", "General", "Other"],
      default: "Housekeeping",
      index: true,
    },
    category: {
      type: String,
      required: true,
      default: "General",
      trim: true,
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
    sellingPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: "pcs", // "pcs", "liters", "kg", "box", "bottles", "packs", "rolls", "pairs", "meters"
    },
    location: {
      type: String,
      default: "Main Store",
      trim: true,
    },
    supplier: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "📦",
    },
    lastRestockedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Virtual property to calculate stock status
inventoryItemSchema.virtual("status").get(function () {
  if (this.quantity <= 0) return "Out of Stock";
  if (this.quantity <= this.minStockLevel) return "Low Stock";
  return "In Stock";
});

inventoryItemSchema.set("toJSON", { virtuals: true });
inventoryItemSchema.set("toObject", { virtuals: true });

export const InventoryItem = mongoose.model("InventoryItem", inventoryItemSchema);
