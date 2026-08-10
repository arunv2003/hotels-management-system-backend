import mongoose from "mongoose";

export const AnnouncementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    publishDate: {
      type: Date,
      required: true,
    },  
    audience: {
      type: String,
      enum: ["All", "Hotel Admins", "New Users", "Loyalty Members"],
      required: true,
    },
    clicks:{
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["info", "success", "warning", "alert", "Offer", "System Update", "News", "Feedback Request"],
      required: true,
    },
    status: {
      type: String,
      default: "Active",
    },
  },
  { timestamps: true },
);

export const Announcement = mongoose.model("Announcement", AnnouncementSchema);
