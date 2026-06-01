import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "BankTransfer", "Other"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Success", "Failed", "Refunded"],
      default: "Success",
    },
    transactionReference: {
      type: String, // E.g. Razorpay payment ID, bank reference, UPI transaction ID
      trim: true,
    },
    remarks: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
