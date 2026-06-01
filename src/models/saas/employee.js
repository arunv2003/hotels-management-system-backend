import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },

    lastName: {
      type: String,
      trim: true,
    },

    employeeCode: {
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

    profileImage: {
      type: String,
    },

    address: {
      type: String,
    },

    city: {
      type: String,
    },
    userType: {
      type: String,
      enum: ["super-admin", "Employee"],
      default: "Employee",
      required: true,
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
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    department: {
      type: String,
      enum: [
        "Human Resources",
        "Front Desk",
        "Management",
        "Maintenance",
        "Marketing",
        "Support",
      ],
      default: "Front Desk",
    },

    designation: {
      type: String,
    },

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
      ref: "User",
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

export const Employee = mongoose.model("Employee", employeeSchema);
