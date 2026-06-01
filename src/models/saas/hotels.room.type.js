import mongoose from "mongoose";

export const hotelRoomTypeSchema = new mongoose.Schema(
  {
    roomType: {
      type: String,
      required: true,
    },
    numberOfRooms: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
);

export const hotelsRoomType = mongoose.model(
  "hotelsRoomType",
  hotelRoomTypeSchema,
);
