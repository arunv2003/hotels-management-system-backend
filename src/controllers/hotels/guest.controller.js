import { ApiError } from "../../common/utils/api.Errors.js";
import { ApiResponse } from "../../common/utils/api.Response.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { Guest } from "../../models/hotels/guest.js";
import { Booking } from "../../models/hotels/booking.js";

/**
 * @desc Get all guests for current hotel with optional search & filtering
 * @route GET /api/guests
 * @access Private
 */
export const getGuests = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const filter = { hotelId };

  if (req.query.idProofType && req.query.idProofType !== "ALL") {
    filter.idProofType = req.query.idProofType;
  }

  let guests = await Guest.find(filter).sort({ createdAt: -1 });

  // Filter search by name, phone, email, idProofNumber, or city
  if (req.query.search && req.query.search.trim()) {
    const term = req.query.search.trim().toLowerCase();
    guests = guests.filter((g) => {
      const name = `${g.firstName || ""} ${g.lastName || ""}`.toLowerCase();
      const phone = (g.phone || "").toLowerCase();
      const altPhone = (g.alternatePhone || "").toLowerCase();
      const email = (g.email || "").toLowerCase();
      const idNum = (g.idProofNumber || "").toLowerCase();
      const city = (g.city || "").toLowerCase();

      return (
        name.includes(term) ||
        phone.includes(term) ||
        altPhone.includes(term) ||
        email.includes(term) ||
        idNum.includes(term) ||
        city.includes(term)
      );
    });
  }

  // Get total bookings count for each guest
  const guestIds = guests.map((g) => g._id);
  const bookings = await Booking.find({ guestId: { $in: guestIds } }).select("guestId createdAt");

  const bookingMap = new Map();
  bookings.forEach((b) => {
    if (b.guestId) {
      const gId = b.guestId.toString();
      const existing = bookingMap.get(gId) || { totalBookings: 0, lastBooking: null };
      existing.totalBookings += 1;
      if (!existing.lastBooking || new Date(b.createdAt) > new Date(existing.lastBooking)) {
        existing.lastBooking = b.createdAt;
      }
      bookingMap.set(gId, existing);
    }
  });

  const enrichedGuests = guests.map((g) => {
    const obj = g.toObject();
    const bData = bookingMap.get(g._id.toString()) || { totalBookings: 0, lastBooking: null };
    obj.totalBookings = bData.totalBookings;
    obj.lastBooking = bData.lastBooking;
    return obj;
  });

  return res
    .status(200)
    .json(new ApiResponse(200, enrichedGuests, "Guests retrieved successfully."));
});

/**
 * @desc Get single guest by ID with booking history
 * @route GET /api/guests/:id
 * @access Private
 */
export const getGuestById = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const guest = await Guest.findOne({ _id: id, hotelId });
  if (!guest) {
    throw new ApiError(404, "Guest not found.");
  }

  const bookings = await Booking.find({ guestId: id })
    .populate({ path: "room", populate: { path: "roomType", select: "roomType" } })
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(
      200,
      { guest, bookings },
      "Guest details fetched successfully."
    )
  );
});

/**
 * @desc Create new guest
 * @route POST /api/guests
 * @access Private
 */
export const createGuest = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const {
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
    country,
    pincode,
  } = req.body;

  if (!firstName || !firstName.trim()) {
    throw new ApiError(400, "First name is required.");
  }
  if (!phone || !phone.trim()) {
    throw new ApiError(400, "Phone number is required.");
  }

  const cleanPhone = phone.trim();
  const existing = await Guest.findOne({ hotelId, phone: cleanPhone });
  if (existing) {
    throw new ApiError(409, "A guest with this phone number already exists.");
  }

  const newGuest = await Guest.create({
    hotelId,
    firstName: firstName.trim(),
    lastName: lastName ? lastName.trim() : "",
    email: email ? email.trim().toLowerCase() : "",
    phone: cleanPhone,
    alternatePhone: alternatePhone ? alternatePhone.trim() : "",
    idProofType: idProofType || "Aadhar Card",
    idProofNumber: idProofNumber ? idProofNumber.trim() : "",
    idProofImage: idProofImage ? idProofImage.trim() : "",
    address: address ? address.trim() : "",
    city: city ? city.trim() : "",
    state: state ? state.trim() : "",
    country: country ? country.trim() : "India",
    pincode: pincode ? pincode.trim() : "",
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newGuest, "Guest created successfully."));
});

/**
 * @desc Update existing guest
 * @route PUT /api/guests/:id
 * @access Private
 */
export const updateGuest = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const guest = await Guest.findOne({ _id: id, hotelId });
  if (!guest) {
    throw new ApiError(404, "Guest not found.");
  }

  const {
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
    country,
    pincode,
  } = req.body;

  if (firstName !== undefined) guest.firstName = firstName.trim();
  if (lastName !== undefined) guest.lastName = lastName.trim();
  if (email !== undefined) guest.email = email.trim().toLowerCase();
  if (phone !== undefined) guest.phone = phone.trim();
  if (alternatePhone !== undefined) guest.alternatePhone = alternatePhone.trim();
  if (idProofType !== undefined) guest.idProofType = idProofType;
  if (idProofNumber !== undefined) guest.idProofNumber = idProofNumber.trim();
  if (idProofImage !== undefined) guest.idProofImage = idProofImage.trim();
  if (address !== undefined) guest.address = address.trim();
  if (city !== undefined) guest.city = city.trim();
  if (state !== undefined) guest.state = state.trim();
  if (country !== undefined) guest.country = country.trim();
  if (pincode !== undefined) guest.pincode = pincode.trim();

  await guest.save();

  return res
    .status(200)
    .json(new ApiResponse(200, guest, "Guest updated successfully."));
});

/**
 * @desc Delete guest
 * @route DELETE /api/guests/:id
 * @access Private
 */
export const deleteGuest = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing from token.");
  }

  const guest = await Guest.findOneAndDelete({ _id: id, hotelId });
  if (!guest) {
    throw new ApiError(404, "Guest not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Guest deleted successfully."));
});
