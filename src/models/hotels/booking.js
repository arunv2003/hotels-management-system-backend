import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },

    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    bookingStatus: {
      type: String,
      enum: ["Pending", "Confirmed", "CheckedIn", "CheckedOut", "Cancelled"],
      default: "Pending",
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "PartiallyPaid", "Paid", "Refunded"],
      default: "Unpaid",
    },
    specialRequests: {
      type: String,
    },
    adultsCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    childrenCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    checkInTime: {
      type: Date, 
    },
    checkOutTime: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  { timestamps: true }
);

export const Booking = mongoose.model("Booking", bookingSchema);
