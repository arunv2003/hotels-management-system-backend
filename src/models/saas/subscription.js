import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },

    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
      required: true,
    },

    subscriptionType: {
      type: String,
      enum: ["Monthly", "Yearly"],
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    endDate: {
      type: Date,
      required: true,
    },

    nextBillingDate: {
      type: Date,
    },

    isTrial: {
      type: Boolean,
      default: false,
    },

    trialStartDate: {
      type: Date,
    },

    trialEndDate: {
      type: Date,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "INR",
    },

    paymentStatus: {
      type: String,
      enum: [
        "Pending",
        "Paid",
        "Failed",
        "Refunded",
      ],
      default: "Pending",
    },

    paymentMethod: {
      type: String,
      enum: [
        "Razorpay",
        "Stripe",
        "UPI",
        "Cash",
        "Card",
      ],
    },

    transactionId: {
      type: String,
    },

    invoiceNumber: {
      type: String,
    },

    autoRenew: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Expired",
        "Cancelled",
        "Suspended",
        "Trial",
      ],
      default: "Active",
    },

    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
    },

    limits: {
      maxBranches: Number,
      maxRooms: Number,
      maxEmployees: Number,
      maxUsers: Number,
    },

    features: {
      bookingManagement: Boolean,
      billing: Boolean,
      reports: Boolean,
      restaurantPOS: Boolean,
      housekeeping: Boolean,
      payroll: Boolean,
      attendance: Boolean,
      inventory: Boolean,
      whatsappNotification: Boolean,
      customBranding: Boolean,
      multiBranch: Boolean,
      apiAccess: Boolean,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

export const Subscription = mongoose.model(
  "Subscription",
  subscriptionSchema
);