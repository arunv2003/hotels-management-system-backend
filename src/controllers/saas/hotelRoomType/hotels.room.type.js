import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { hotelsRoomType } from "../../../models/saas/hotels.room.type.js";

export const createHotelstype = asyncHandler(async (req, res) => {
  const { roomType, numberOfRooms } = req.body;
  if (!roomType) {
    return res.status(404).json(new ApiError(404, "Room Type Required"));
  }
  if (!numberOfRooms) {
    return res.status(404).json(new ApiError(404, "Number Of Rooms Required"));
  }

  const existingRooms = await hotelsRoomType.find({
    roomType,
    numberOfRooms,
  });

  if (existingRooms.length > 0) {
    return res.status(400).json({
      message: "Room type and room number already exist",
    });
  }

  const createNewRoomType = await hotelsRoomType.create({
    roomType,
    numberOfRooms,
  });
  return res
    .status(200)
    .json(
      new ApiResponse(200, createNewRoomType, "Room Type Created Successfully"),
    );
});
export const getHotelstype = asyncHandler(async (req, res) => {
  const RoomTypes = await hotelsRoomType.find();
  return res
    .status(200)
    .json(new ApiResponse(200, RoomTypes, "Room Type Created Successfully"));
});
export const updateHotelstype = asyncHandler(async (req, res) => {
  const { roomType, numberOfRooms } = req.body;
  const { _id } = req.params;
  console.log(_id,"Sasasas")
  if (!_id) {
    return res.status(404).json(new ApiError(404, "_id  Required"));
  }
  if (!roomType) {
    return res.status(404).json(new ApiError(404, "Room Type Required"));
  }
  if (!numberOfRooms) {
    return res.status(404).json(new ApiError(404, "Number Of Rooms Required"));
  }

  const existingRoom = await hotelsRoomType.findOne({
    roomType,
    numberOfRooms,
    _id: { $ne: _id },
  });

  if (existingRoom) {
    return res.status(400).json({
      message: "Room type and room number already exist",
    });
  }

  const updatedRoom = await hotelsRoomType.findByIdAndUpdate(
    _id,
    {
      roomType,
      numberOfRooms,
    },
    { new: true },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedRoom, "Room Type updated Successfully"),
    );
});
export const deleteHotelstype = asyncHandler(async (req, res) => {
  const { _id } = req.params;

  const deleteNewRoomType = await hotelsRoomType.findByIdAndDelete(_id);
  return res
    .status(200)
    .json(
      new ApiResponse(200, deleteNewRoomType, "Room Type Deleted Successfully"),
    );
});
