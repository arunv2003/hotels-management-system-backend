import { ApiError } from "../../common/utils/api.Errors.js";
import { ApiResponse } from "../../common/utils/api.Response.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { Booking } from "../../models/hotels/booking.js";
import { Guest } from "../../models/hotels/guest.js";
import { Room } from "../../models/hotels/room.js";

/**
 * @desc Create a new booking with guest details & ID proof image URL
 * @route POST /api/bookings
 * @access Private
 */
export const createBooking = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const {
    guestId: providedGuestId,
    // Guest info fields (if creating new guest or updating details)
    firstName,
    lastName,
    email,
    phone,
    alternatePhone,
    idProofType,
    idProofNumber,
    idProofImage,
    address,
    city,
    state,
    pincode,
    // Booking info fields
    room: roomId,
    checkInDate,
    checkOutDate,
    bookingStatus,
    totalAmount,
    paidAmount,
    paymentStatus,
    specialRequests,
    adultsCount,
    childrenCount,
  } = req.body;

  if (!roomId) {
    throw new ApiError(400, "Room is required.");
  }
  if (!checkInDate || !checkOutDate) {
    throw new ApiError(400, "Check-in and Check-out dates are required.");
  }

  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new ApiError(400, "Invalid Check-in or Check-out date format.");
  }
  if (start >= end) {
    throw new ApiError(400, "Check-out date must be after Check-in date.");
  }

  // 1. Verify Room exists for this hotel
  const roomDoc = await Room.findOne({ _id: roomId, hotelId });
  if (!roomDoc) {
    throw new ApiError(404, "Selected room not found in your hotel.");
  }

  // 2. Resolve or Create Guest
  let targetGuestId = providedGuestId;

  if (!targetGuestId) {
    if (!firstName || !firstName.trim()) {
      throw new ApiError(400, "Guest first name is required when creating a booking.");
    }
    if (!phone || !phone.trim()) {
      throw new ApiError(400, "Guest phone number is required.");
    }

    const cleanPhone = phone.trim();

    // Check if guest already exists by phone & hotelId
    let guestDoc = await Guest.findOne({ hotelId, phone: cleanPhone });

    if (guestDoc) {
      // Update existing guest info with any new ID proof details
      if (firstName) guestDoc.firstName = firstName.trim();
      if (lastName !== undefined) guestDoc.lastName = lastName.trim();
      if (email !== undefined) guestDoc.email = email.trim();
      if (idProofType !== undefined) guestDoc.idProofType = idProofType;
      if (idProofNumber !== undefined) guestDoc.idProofNumber = idProofNumber.trim();
      if (idProofImage !== undefined) guestDoc.idProofImage = idProofImage.trim();
      if (address !== undefined) guestDoc.address = address;
      if (city !== undefined) guestDoc.city = city;
      if (state !== undefined) guestDoc.state = state;

      await guestDoc.save();
      targetGuestId = guestDoc._id;
    } else {
      // Create new guest record
      const newGuest = await Guest.create({
        hotelId,
        firstName: firstName.trim(),
        lastName: lastName ? lastName.trim() : "",
        email: email ? email.trim() : "",
        phone: cleanPhone,
        alternatePhone: alternatePhone ? alternatePhone.trim() : "",
        idProofType: idProofType || "Aadhar Card",
        idProofNumber: idProofNumber ? idProofNumber.trim() : "",
        idProofImage: idProofImage ? idProofImage.trim() : "",
        address: address || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
      });
      targetGuestId = newGuest._id;
    }
  } else {
    // Check if provided guestId exists, and update idProofImage if supplied
    const existingGuest = await Guest.findOne({ _id: targetGuestId, hotelId });
    if (!existingGuest) {
      throw new ApiError(404, "Guest record not found.");
    }

    let modified = false;
    if (idProofImage !== undefined && idProofImage !== existingGuest.idProofImage) {
      existingGuest.idProofImage = idProofImage.trim();
      modified = true;
    }
    if (idProofType !== undefined && idProofType !== existingGuest.idProofType) {
      existingGuest.idProofType = idProofType;
      modified = true;
    }
    if (idProofNumber !== undefined && idProofNumber !== existingGuest.idProofNumber) {
      existingGuest.idProofNumber = idProofNumber.trim();
      modified = true;
    }
    if (modified) {
      await existingGuest.save();
    }
  }

  // 3. Create Booking
  const finalStatus = bookingStatus || "Confirmed";
  const numTotalAmount = totalAmount !== undefined ? Number(totalAmount) : 0;
  const numPaidAmount = paidAmount !== undefined ? Number(paidAmount) : 0;

  if (numTotalAmount > 0 && numPaidAmount > numTotalAmount) {
    throw new ApiError(400, "Paid amount cannot be greater than Total bill amount.");
  }

  let calculatedPaymentStatus = paymentStatus || "Unpaid";
  if (numPaidAmount >= numTotalAmount && numTotalAmount > 0) {
    calculatedPaymentStatus = "Paid";
  } else if (numPaidAmount > 0) {
    calculatedPaymentStatus = "PartiallyPaid";
  }

  const newBooking = await Booking.create({
    hotelId,
    guestId: targetGuestId,
    room: roomId,
    checkInDate: start,
    checkOutDate: end,
    bookingStatus: finalStatus,
    totalAmount: numTotalAmount,
    paidAmount: numPaidAmount,
    paymentStatus: calculatedPaymentStatus,
    specialRequests: specialRequests || "",
    adultsCount: adultsCount ? Number(adultsCount) : 1,
    childrenCount: childrenCount ? Number(childrenCount) : 0,
    checkInTime: finalStatus === "CheckedIn" ? new Date() : undefined,
    createdBy: req.user?.id,
  });

  // 4. Update Room Status if CheckedIn
  if (finalStatus === "CheckedIn") {
    roomDoc.status = "Occupied";
    await roomDoc.save();
  }

  const populatedBooking = await Booking.findById(newBooking._id)
    .populate("guestId")
    .populate({
      path: "room",
      populate: { path: "roomType", select: "roomType pricePerNight" },
    });

  return res
    .status(201)
    .json(new ApiResponse(201, populatedBooking, "Booking created successfully."));
});

/**
 * @desc Get all bookings for current hotel with optional filtering & search
 * @route GET /api/bookings
 * @access Private
 */
export const getBookings = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const filter = { hotelId };

  if (req.query.bookingStatus) {
    filter.bookingStatus = req.query.bookingStatus;
  }
  if (req.query.paymentStatus) {
    filter.paymentStatus = req.query.paymentStatus;
  }
  if (req.query.room) {
    filter.room = req.query.room;
  }

  let bookings = await Booking.find(filter)
    .populate("guestId")
    .populate({
      path: "room",
      populate: { path: "roomType", select: "roomType pricePerNight" },
    })
    .sort({ createdAt: -1 });

  // Optional search string filter across guest name, phone, room number
  if (req.query.search && req.query.search.trim()) {
    const term = req.query.search.trim().toLowerCase();
    bookings = bookings.filter((b) => {
      const guestName = `${b.guestId?.firstName || ""} ${b.guestId?.lastName || ""}`.toLowerCase();
      const guestPhone = (b.guestId?.phone || "").toLowerCase();
      const roomNum = (b.room?.roomNumber || "").toLowerCase();

      return (
        guestName.includes(term) ||
        guestPhone.includes(term) ||
        roomNum.includes(term)
      );
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, bookings, "Bookings fetched successfully."));
});

/**
 * @desc Get single booking by ID
 * @route GET /api/bookings/:id
 * @access Private
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const booking = await Booking.findOne({ _id: id, hotelId })
    .populate("guestId")
    .populate({
      path: "room",
      populate: { path: "roomType", select: "roomType pricePerNight" },
    });

  if (!booking) {
    throw new ApiError(404, "Booking not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, booking, "Booking fetched successfully."));
});

/**
 * @desc Update booking status, details, or guest ID image URL
 * @route PUT /api/bookings/:id
 * @access Private
 */
export const updateBooking = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const booking = await Booking.findOne({ _id: id, hotelId }).populate("guestId");
  if (!booking) {
    throw new ApiError(404, "Booking not found or unauthorized.");
  }

  const {
    bookingStatus,
    paymentStatus,
    paidAmount,
    totalAmount,
    checkInDate,
    checkOutDate,
    specialRequests,
    adultsCount,
    childrenCount,
    room: newRoomId,
    // Guest info updates
    idProofImage,
    idProofType,
    idProofNumber,
    firstName,
    lastName,
    phone,
    email,
  } = req.body;

  // 1. Update guest document if any guest fields passed
  if (booking.guestId) {
    const guestDoc = await Guest.findById(booking.guestId._id || booking.guestId);
    if (guestDoc) {
      if (idProofImage !== undefined) guestDoc.idProofImage = idProofImage.trim();
      if (idProofType !== undefined) guestDoc.idProofType = idProofType;
      if (idProofNumber !== undefined) guestDoc.idProofNumber = idProofNumber.trim();
      if (firstName !== undefined) guestDoc.firstName = firstName.trim();
      if (lastName !== undefined) guestDoc.lastName = lastName.trim();
      if (phone !== undefined) guestDoc.phone = phone.trim();
      if (email !== undefined) guestDoc.email = email.trim();
      await guestDoc.save();
    }
  }

  // 2. Handle room change if applicable
  const previousRoomId = booking.room;
  if (newRoomId && newRoomId.toString() !== previousRoomId.toString()) {
    const roomExists = await Room.findOne({ _id: newRoomId, hotelId });
    if (!roomExists) {
      throw new ApiError(404, "New room selected not found.");
    }
    booking.room = newRoomId;
  }

  // 3. Update date fields
  if (checkInDate) booking.checkInDate = new Date(checkInDate);
  if (checkOutDate) booking.checkOutDate = new Date(checkOutDate);

  // 4. Update amounts & payment status
  if (totalAmount !== undefined) booking.totalAmount = Number(totalAmount);
  if (paidAmount !== undefined) booking.paidAmount = Number(paidAmount);

  if (paymentStatus) {
    booking.paymentStatus = paymentStatus;
  } else if (paidAmount !== undefined || totalAmount !== undefined) {
    if (booking.paidAmount >= booking.totalAmount && booking.totalAmount > 0) {
      booking.paymentStatus = "Paid";
    } else if (booking.paidAmount > 0) {
      booking.paymentStatus = "PartiallyPaid";
    } else {
      booking.paymentStatus = "Unpaid";
    }
  }

  if (specialRequests !== undefined) booking.specialRequests = specialRequests;
  if (adultsCount !== undefined) booking.adultsCount = Number(adultsCount);
  if (childrenCount !== undefined) booking.childrenCount = Number(childrenCount);

  // 5. Status changes and Room status synchronization
  if (bookingStatus && bookingStatus !== booking.bookingStatus) {
    const oldStatus = booking.bookingStatus;
    booking.bookingStatus = bookingStatus;

    if (bookingStatus === "CheckedIn") {
      booking.checkInTime = new Date();
      await Room.findByIdAndUpdate(booking.room, { status: "Occupied" });
    } else if (bookingStatus === "CheckedOut") {
      booking.checkOutTime = new Date();
      await Room.findByIdAndUpdate(booking.room, { status: "Available" });
    } else if (bookingStatus === "Cancelled") {
      await Room.findByIdAndUpdate(booking.room, { status: "Available" });
    }
  }

  await booking.save();

  const updatedBooking = await Booking.findById(booking._id)
    .populate("guestId")
    .populate({
      path: "room",
      populate: { path: "roomType", select: "roomType pricePerNight" },
    });

  return res
    .status(200)
    .json(new ApiResponse(200, updatedBooking, "Booking updated successfully."));
});

/**
 * @desc Delete booking by ID
 * @route DELETE /api/bookings/:id
 * @access Private
 */
export const deleteBooking = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const deletedBooking = await Booking.findOneAndDelete({ _id: id, hotelId });
  if (!deletedBooking) {
    throw new ApiError(404, "Booking not found or unauthorized to delete.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedBooking, "Booking deleted successfully."));
});
