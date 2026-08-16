import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
  },
  name: {
    type: String,
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
  tax: {
    type: Number,
    default: 0,
  },
  image: {
    type: String,
    default: "🍽️",
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
    guestRoom: {
      type: String,
      default: "",
    },
    tableNumber: {
      type: String,
      default: "",
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
      enum: ["RoomService", "DineIn", "Takeaway", "Direct"],
      default: "Direct",
    },
    orderStatus: {
      type: String,
      enum: ["Received", "Preparing", "Served", "Delivered", "Cancelled"],
      default: "Received",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "room_charge"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["Unpaid", "Paid", "ChargedToRoom"],
      default: "Paid",
    },
  },
  { timestamps: true }
);

export const POSOrder = mongoose.model("POSOrder", posOrderSchema);
