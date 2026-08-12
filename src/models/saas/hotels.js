import mongoose from "mongoose";
import { hotelsRoomType } from "./hotels.room.type.js";

const hotelSchema = new mongoose.Schema(
  {
    hotelName: {
      type: String,
      required: true,
      trim: true,
    },
    hotelType: {
      type: String,
      default: "hotel",
      enum: [
        "hotel",
        "resort",
        "hostel",
        "apartment",
        "guest-house",
        "homestay",
        "villa",
        "boutique-hotel",
        "business-hotel",
        "extended-stay",
        "residence-hotel",
        "resort-hotel",
      ],
    },
    brandName: {
      type: String,
      trim: true,
    },
    hotelDescription: {
      type: String,
      required: true,
    },
    establishedYear: {
      type: Number,
      min: 1800,
      max: new Date().getFullYear(),
    },

    starRating: {
      type: String,
      default: "3",
      enum: ["1", "2", "3", "4", "5"],
    },
    gstNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    panNumber: {
      type: String,
      uppercase: true,
      trim: true,
    },
    taxType: {
      type: String,
      default: "GST",
      enum: ["GST", "VAT", "Service Tax", "None"],
    },

    website: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    ownerFullName: {
      type: String,
      required: true,
    },
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    alternateNumber: {
      type: String,
    },
    ownerProfilePhoto: { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    country: {
      type: String,
      default: "India",
    },
    state: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    fullAddress: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    mapLocation: {
      type: String,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
    currency: {
      type: String,
      default: "INR",
    },
    checkInTime: {
      type: String,
      default: "12:00",
    },
    checkOutTime: {
      type: String,
      default: "11:00",
    },
    invoicePrefix: {
      type: String,
      default: "INV-",
    },
    financialYear: {
      type: String,
      default: "April-March (FY)",
    },
    dateFormat: {
      type: String,
      default: "DD-MM-YYYY",
      enum: ["DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD"],
    },

    planSelected: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plan",
    },
    billingCycle: {
      type: String,
      default: "monthly",
      enum: ["monthly", "half-yearly", "yearly", "quarterly"],
    },
    couponCode: {
      type: String,
    },

    totalRooms: {
      type: Number,
      required: true,
      min: 1,
    },
    totalFloors: {
      type: Number,
      min: 1,
    },
    maxGuests: {
      type: Number,
      min: 1,
    },
    roomTypes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "hotelsRoomType",
      },
    ],

    amenities: [
      {
        type: String,
        enum: [
          "WiFi",
          "Parking",
          "Restaurant",
          "Laundry",
          "Room Service",
          "AC",
          "Pool",
          "Gym",
          "Spa",
          "Bar",
          "Conference Hall",
          "Airport Pickup",
        ],
      },
    ],

    documents: {
      gstCertificate: { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },
      panCard:        { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },
      hotelLicense:   { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },
      ownerId:        { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },
    },
    hotelImages: [
      { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },
    ],
    hotelLogo: { cloudUrl: { type: String, default: null }, publicId: { type: String, default: null } },

    staff: [
      {
        fullName: { type: String },
        role: {
          type: String,
          enum: [
            "Receptionist",
            "Manager",
            "Accountant",
            "Housekeeping",
            "Chef",
            "Security",
          ],
        },
        email: { type: String, lowercase: true },
        phone: { type: String },
      },
    ],

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

hotelSchema.pre("save", function () {
  this.confirmPassword = undefined;
});

hotelSchema.index({
  hotelName: "text",
  hotelDescription: "text",
  city: "text",
});

const Hotel = mongoose.model("Hotel", hotelSchema);

export default Hotel;

