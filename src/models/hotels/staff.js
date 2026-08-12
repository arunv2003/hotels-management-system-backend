import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    // Tenant & Hotel Relations
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },


    // Basic Info
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    fullName: {
      type: String,
    },
    staffCode: {
      type: String,
      unique: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    dob: {
      type: Date,
    },

    // Contact
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
    },
    alternatePhone: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },

    // Profile & Address
    profileImage: {
      type: String,
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
    },
    pincode: {
      type: String,
    },

    // Role & Department
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StaffRole",
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
    },
    designation: {
      type: String,
    },

    // Employment details
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employmentType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Contract", "Intern"],
      default: "Full-Time",
    },
    shift: {
      type: String,
      enum: ["Morning", "Evening", "Night"],
    },
    salary: {
      type: Number,
    },
    salaryType: {
      type: String,
      enum: ["Monthly", "Hourly"],
      default: "Monthly",
    },

    // Verification
    aadharNumber: {
      type: String,
    },
    panNumber: {
      type: String,
    },
    documents: [
      {
        name: String,
        url: String,
      },
    ],

    // Metadata
    permissions: [
      {
        type: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    deviceInfo: {
      type: String,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
  },
  {
    timestamps: true,
  }
);

export const Staff = mongoose.model("Staff", staffSchema);
