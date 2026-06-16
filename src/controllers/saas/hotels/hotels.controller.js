import bcrypt from "bcryptjs";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";
import Hotel from "../../../models/saas/hotels.js";
import { Plan } from "../../../models/saas/plans.js";


const pickCloudinary = (doc) => {
  if (!doc) return null;
  const { cloudUrl, publicId } = doc;
  if (!cloudUrl) return null;
  return { cloudUrl: cloudUrl || null, publicId: publicId || null };
};

export const registerHotel = asyncHandler(async (req, res) => {
  const {
    hotelName,
    hotelType,
    brandName,
    hotelDescription,
    establishedYear,
    starRating,
    gstNumber,
    panNumber,
    taxType,
    website,
    email,
    ownerFullName,
    ownerEmail,
    mobileNumber,
    alternateNumber,
    password,
    country,
    state,
    city,
    fullAddress,
    pincode,
    mapLocation,
    latitude,
    longitude,
    timezone,
    currency,
    checkInTime,
    checkOutTime,
    invoicePrefix,
    financialYear,
    dateFormat,
    planSelected,
    billingCycle,
    couponCode,
    totalRooms,
    totalFloors,
    maxGuests,
    roomTypes,
    amenities,
    staff,
    documents,
    hotelImages,
    hotelLogo,
    ownerProfilePhoto,
  } = req.body;

  console.log(req.body);

  if (!hotelName) throw new ApiError(400, "Hotel name is required.");
  if (!hotelDescription) throw new ApiError(400, "Hotel description is required.");
  if (!ownerFullName) throw new ApiError(400, "Owner full name is required.");
  if (!ownerEmail) throw new ApiError(400, "Owner email is required.");
  if (!mobileNumber) throw new ApiError(400, "Mobile number is required.");
  if (!password) throw new ApiError(400, "Password is required.");
  if (!state) throw new ApiError(400, "State is required.");
  if (!city) throw new ApiError(400, "City is required.");
  if (!fullAddress) throw new ApiError(400, "Full address is required.");
  if (!pincode) throw new ApiError(400, "Pincode is required.");
  if (!totalRooms) throw new ApiError(400, "Total rooms is required.");

  const existing = await Hotel.findOne({
    $or: [
      { ownerEmail: ownerEmail.toLowerCase() },
      { mobileNumber },
    ],
  });
  if (existing) {
    throw new ApiError(
      409,
      "A hotel with this owner email or mobile number already exists."
    );
  }

  let resolvedPlanId;
  if (planSelected) {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(planSelected);
    const plan = isObjectId 
      ? await Plan.findById(planSelected) 
      : await Plan.findOne({ slug: planSelected.toLowerCase() });
      
    if (!plan) throw new ApiError(404, "Selected plan not found.");
    resolvedPlanId = plan._id;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const normalizedDocuments = {
    gstCertificate: pickCloudinary(documents?.gstCertificate),
    panCard:        pickCloudinary(documents?.panCard),
    hotelLicense:   pickCloudinary(documents?.hotelLicense),
    ownerId:        pickCloudinary(documents?.ownerId),
  };

  const normalizedHotelImages = Array.isArray(hotelImages)
    ? hotelImages.map(pickCloudinary).filter(Boolean)
    : [];
  const hotel = await Hotel.create({
    hotelName,
    hotelType,
    brandName,
    hotelDescription,
    establishedYear: establishedYear ? Number(establishedYear) : undefined,
    starRating,
    gstNumber,
    panNumber,
    taxType,
    website,
    email,
    ownerFullName,
    ownerEmail,
    mobileNumber,
    alternateNumber,
    password: hashedPassword,
    country,
    state,
    city,
    fullAddress,
    pincode,
    mapLocation,
    latitude,
    longitude,
    timezone,
    currency,
    checkInTime,
    checkOutTime,
    invoicePrefix,
    financialYear,
    dateFormat,
    planSelected: resolvedPlanId || undefined,
    billingCycle,
    couponCode,
    totalRooms: Number(totalRooms),
    totalFloors: totalFloors ? Number(totalFloors) : undefined,
    maxGuests: maxGuests ? Number(maxGuests) : undefined,
    roomTypes: Array.isArray(roomTypes) ? roomTypes : [],
    amenities: Array.isArray(amenities) ? amenities : [],
    staff: Array.isArray(staff) ? staff : [],
    documents: normalizedDocuments,
    hotelImages: normalizedHotelImages,
    hotelLogo: pickCloudinary(hotelLogo),
    ownerProfilePhoto: pickCloudinary(ownerProfilePhoto),
  });
  const hotelObj = hotel.toObject();
  delete hotelObj.password;

  return res
    .status(201)
    .json(new ApiResponse(201, hotelObj, "Hotel registered successfully."));
});


export const getAllHotels = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = "", isActive } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { hotelName: { $regex: search, $options: "i" } },
      { city: { $regex: search, $options: "i" } },
      { ownerEmail: { $regex: search, $options: "i" } },
    ];
  }
  if (isActive !== undefined) {
    filter.isActive = isActive === "true";
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [hotels, total] = await Promise.all([
    Hotel.find(filter)
      .select("-password")
      .populate("planSelected", "name slug halfYearlyPrice yearlyPrice")
      .populate("roomTypes", "roomType numberOfRooms")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Hotel.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hotels,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
      "Hotels fetched successfully."
    )
  );
});


export const getHotelById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id)
    .select("-password")
    .populate("planSelected", "name slug halfYearlyPrice yearlyPrice features")
    .populate("roomTypes", "roomType numberOfRooms");

  if (!hotel) throw new ApiError(404, "Hotel not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, hotel, "Hotel fetched successfully."));
});


export const updateHotel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id);
  if (!hotel) throw new ApiError(404, "Hotel not found.");
  const {
    password,
    confirmPassword,
    documents,
    hotelImages,
    hotelLogo,
    ownerProfilePhoto,
    totalRooms,
    totalFloors,
    maxGuests,
    establishedYear,
    planSelected,
    roomTypes,
    amenities,
    staff,
    ...rest
  } = req.body;

  const updateData = { ...rest };

  if (totalRooms !== undefined) updateData.totalRooms = Number(totalRooms);
  if (totalFloors !== undefined) updateData.totalFloors = Number(totalFloors);
  if (maxGuests !== undefined) updateData.maxGuests = Number(maxGuests);
  if (establishedYear !== undefined)
    updateData.establishedYear = Number(establishedYear);
  if (planSelected !== undefined && planSelected !== "") {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(planSelected);
    const plan = isObjectId 
      ? await Plan.findById(planSelected) 
      : await Plan.findOne({ slug: planSelected.toLowerCase() });
      
    if (!plan) throw new ApiError(404, "Selected plan not found.");
    updateData.planSelected = plan._id;
  } else if (planSelected === "") {
    updateData.planSelected = undefined;
  }
  if (Array.isArray(roomTypes)) updateData.roomTypes = roomTypes;
  if (Array.isArray(amenities)) updateData.amenities = amenities;
  if (Array.isArray(staff)) updateData.staff = staff;

  if (password) {
    updateData.password = await bcrypt.hash(password, 12);
  }

  if (documents) {
    updateData.documents = {
      gstCertificate:
        pickCloudinary(documents.gstCertificate) ?? hotel.documents?.gstCertificate,
      panCard:
        pickCloudinary(documents.panCard) ?? hotel.documents?.panCard,
      hotelLicense:
        pickCloudinary(documents.hotelLicense) ?? hotel.documents?.hotelLicense,
      ownerId:
        pickCloudinary(documents.ownerId) ?? hotel.documents?.ownerId,
    };
  }
  if (hotelImages !== undefined) {
    updateData.hotelImages = Array.isArray(hotelImages)
      ? hotelImages.map(pickCloudinary).filter(Boolean)
      : hotel.hotelImages;
  }
  if (hotelLogo !== undefined) {
    updateData.hotelLogo = pickCloudinary(hotelLogo) ?? hotel.hotelLogo;
  }
  if (ownerProfilePhoto !== undefined) {
    updateData.ownerProfilePhoto =
      pickCloudinary(ownerProfilePhoto) ?? hotel.ownerProfilePhoto;
  }

  const updated = await Hotel.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-password")
    .populate("planSelected", "name slug")
    .populate("roomTypes", "roomType numberOfRooms");

  return res
    .status(200)
    .json(new ApiResponse(200, updated, "Hotel updated successfully."));
});


export const deleteHotel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await Hotel.findByIdAndDelete(id);
  if (!hotel) throw new ApiError(404, "Hotel not found.");

  return res
    .status(200)
    .json(new ApiResponse(200, { id }, "Hotel deleted successfully."));
});

export const toggleHotelStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const hotel = await Hotel.findById(id);
  if (!hotel) throw new ApiError(404, "Hotel not found.");

  hotel.isActive = !hotel.isActive;
  await hotel.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      { id, isActive: hotel.isActive },
      `Hotel ${hotel.isActive ? "activated" : "deactivated"} successfully.`
    )
  );
});
