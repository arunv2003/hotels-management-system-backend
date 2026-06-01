import mongoose from "mongoose";

const guestSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    alternatePhone: {
      type: String,
      trim: true,
    },
    idProofType: {
      type: String,
      enum: ["Aadhar Card", "PAN Card", "Passport", "Driving License", "Other"],
    },
    idProofNumber: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    country: {
      type: String,
      default: "India",
    },
    pincode: {
      type: String,
    },
  },
  { timestamps: true }
);

export const Guest = mongoose.model("Guest", guestSchema);
