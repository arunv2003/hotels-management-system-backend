import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["Financial", "Occupancy", "F&B", "Inventory", "Payroll"],
      required: true,
    },
    format: {
      type: String,
      enum: ["PDF", "Excel", "CSV"],
      required: true,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    fileUrl: {
      type: String, // Path to local or cloud storage (S3/Supabase storage) file
      required: true,
    },
  },
  { timestamps: true }
);

export const Report = mongoose.model("Report", reportSchema);
