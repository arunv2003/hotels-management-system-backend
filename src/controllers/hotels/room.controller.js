import { ApiError } from "../../common/utils/api.Errors.js";
import { ApiResponse } from "../../common/utils/api.Response.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { Room } from "../../models/hotels/room.js";
import Hotel from "../../models/saas/hotels.js";
import { hotelsRoomType } from "../../models/saas/hotels.room.type.js";

/**
 * @desc Create a new room for a hotel
 * @route POST /api/rooms
 * @access Private (Hotel / Staff)
 */
export const createRoom = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const { roomType, roomNumber, floor, status } = req.body;

  if (!roomType) {
    throw new ApiError(400, "Room Type is required.");
  }
  if (!roomNumber || !roomNumber.toString().trim()) {
    throw new ApiError(400, "Room Number is required.");
  }

  const cleanRoomNumber = roomNumber.toString().trim();

  // 1. Verify Hotel exists & roomType is assigned to the hotel
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ApiError(404, "Hotel property not found.");
  }

  const isAssigned = Array.isArray(hotel.roomTypes) && hotel.roomTypes.some(
    (id) => id.toString() === roomType.toString()
  );

  if (!isAssigned) {
    throw new ApiError(400, "This room type is not assigned to your hotel.");
  }

  // 2. Fetch roomType detail & check capacity limit (numberOfRooms)
  const roomTypeDoc = await hotelsRoomType.findById(roomType);
  if (!roomTypeDoc) {
    throw new ApiError(404, "Room type detail not found.");
  }

  const maxAllowedRooms = Number(roomTypeDoc.numberOfRooms) || 0;
  const currentCount = await Room.countDocuments({ hotelId, roomType });

  if (currentCount >= maxAllowedRooms) {
    throw new ApiError(
      400,
      `Cannot add room. Maximum room limit (${maxAllowedRooms}) reached for '${roomTypeDoc.roomType}'.`
    );
  }

  // 3. Verify Room Number uniqueness for this hotel and room type
  const existingRoom = await Room.findOne({
    hotelId,
    roomType,
    roomNumber: cleanRoomNumber,
  });
  if (existingRoom) {
    throw new ApiError(
      400,
      `Room number '${cleanRoomNumber}' already exists for this room type in your hotel.`
    );
  }

  // 4. Create room
  const newRoom = await Room.create({
    hotelId,
    roomType,
    roomNumber: cleanRoomNumber,
    floor: floor || "",
    status: status || "Available",
  });

  await newRoom.populate("roomType", "roomType numberOfRooms");

  return res
    .status(201)
    .json(new ApiResponse(201, newRoom, "Room added successfully."));
});

/**
 * @desc Get all rooms for current hotel
 * @route GET /api/rooms
 * @access Private
 */
export const getRooms = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const filter = { hotelId };
  if (req.query.roomType) {
    filter.roomType = req.query.roomType;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }

  const rooms = await Room.find(filter)
    .populate("roomType", "roomType numberOfRooms")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, rooms, "Rooms fetched successfully."));
});

/**
 * @desc Get room types summary with allocated limits vs created room counts
 * @route GET /api/rooms/summary
 * @access Private
 */
export const getRoomTypesSummary = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const hotel = await Hotel.findById(hotelId).populate("roomTypes");
  if (!hotel) {
    throw new ApiError(404, "Hotel property not found.");
  }

  const assignedRoomTypes = Array.isArray(hotel.roomTypes) ? hotel.roomTypes : [];

  const summary = await Promise.all(
    assignedRoomTypes.map(async (rt) => {
      const createdCount = await Room.countDocuments({ hotelId, roomType: rt._id });
      const maxRooms = Number(rt.numberOfRooms) || 0;
      return {
        _id: rt._id,
        roomType: rt.roomType,
        numberOfRooms: maxRooms,
        createdCount,
        remainingSlots: Math.max(0, maxRooms - createdCount),
      };
    })
  );

  return res
    .status(200)
    .json(new ApiResponse(200, summary, "Room types summary fetched successfully."));
});

/**
 * @desc Delete a room by ID
 * @route DELETE /api/rooms/:id
 * @access Private
 */
export const deleteRoom = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, "Room ID is required.");
  }

  const deletedRoom = await Room.findOneAndDelete({ _id: id, hotelId });
  if (!deletedRoom) {
    throw new ApiError(404, "Room not found or unauthorized to delete.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedRoom, "Room deleted successfully."));
});

/**
 * @desc Update room details
 * @route PUT /api/rooms/:id
 * @access Private
 */
export const updateRoom = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;
  const { roomNumber, floor, status } = req.body;

  const room = await Room.findOne({ _id: id, hotelId });
  if (!room) {
    throw new ApiError(404, "Room not found or unauthorized.");
  }

  if (roomNumber && roomNumber.toString().trim() !== room.roomNumber) {
    const cleanRoomNum = roomNumber.toString().trim();
    const existing = await Room.findOne({
      hotelId,
      roomType: room.roomType,
      roomNumber: cleanRoomNum,
      _id: { $ne: id },
    });
    if (existing) {
      throw new ApiError(
        400,
        `Room number '${cleanRoomNum}' already exists for this room type in your hotel.`
      );
    }
    room.roomNumber = cleanRoomNum;
  }

  if (floor !== undefined) room.floor = floor;
  if (status !== undefined) room.status = status;

  await room.save();
  await room.populate("roomType", "roomType numberOfRooms");

  return res
    .status(200)
    .json(new ApiResponse(200, room, "Room updated successfully."));
});
