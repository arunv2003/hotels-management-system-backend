import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
});

const posOrderSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      index: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    tableNumber: {
      type: String,
    },
    items: [orderItemSchema],
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    orderType: {
      type: String,
      enum: ["RoomService", "DineIn", "Takeaway"],
      required: true,
    },
    orderStatus: {
      type: String,
      enum: ["Received", "Preparing", "Served", "Delivered", "Cancelled"],
      default: "Received",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "ChargedToRoom"],
      default: "Unpaid",
    },
  },
  { timestamps: true }
);

export const POSOrder = mongoose.model("POSOrder", posOrderSchema);
