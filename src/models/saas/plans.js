import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
    },
    halfYearlyPrice: {
      type: String,
      required: true,
    },
    yearlyPrice: {
      type: String,
      required: true,
    },
    trialDays: {
      type: Number,
      default: 0,
    },
    maxDailyBookings: {
      type: Number,
      default: 15,
    },
    maxStaff: {
      type: Number,
      default: 15,
    },
    features: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

// FIXED: Use async function without next parameter
planSchema.pre('save', async function() {
  if (this.name && !this.slug) {
    this.slug = this.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-');
  }
});

export const Plan = mongoose.models.Plan || mongoose.model("Plan", planSchema);