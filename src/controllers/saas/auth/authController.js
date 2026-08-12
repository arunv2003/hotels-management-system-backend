import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../../models/saas/user.js";
import Hotel from "../../../models/saas/hotels.js";
import { hotelsRoomType } from "../../../models/saas/hotels.room.type.js";
import { Employee } from "../../../models/saas/employee.js";
import { Staff } from "../../../models/hotels/staff.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiReaponse } from "../../../common/utils/api.Response.js";
import { generateAccessToken, generateRefreshToken } from "../../../common/utils/token.js";

const generateAccessAndRefereshTokens = async (entity, extraPayload = {}) => {
  try {
    const accessToken = generateAccessToken(entity, extraPayload);
    const refreshToken = generateRefreshToken(entity, extraPayload);

    if (entity && typeof entity.save === "function") {
      entity.refreshToken = refreshToken;
      await entity.save({ validateBeforeSave: false });
    }

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", error);
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens.");
  }
};

export const loginSuperAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide both email and password.");
  }

  const normalizedEmail = email.toLowerCase().trim();

  let accountEntity = null;
  let responseUserObj = null;
  let tokenExtraPayload = {};

  // 1. Check User model (Super Admin / SaaS User)
  const user = await User.findOne({ email: normalizedEmail }).populate("role");
  if (user) {
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      throw new ApiError(401, "Invalid credentials.");
    }
    accountEntity = user;
    const userType = user.userType || "super-admin";
    let permissions = "ALL";

    if (userType === "Employee") {
      if (user.role && user.role.permissions) {
        permissions = user.role.permissions instanceof Map 
          ? Object.fromEntries(user.role.permissions) 
          : user.role.permissions;
      } else {
        permissions = {};
      }
    }

    tokenExtraPayload = { userType };

    responseUserObj = {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: userType,
      role: user.role || null,
      permissions: permissions,
      createdAt: user.createdAt,
    };
  }

  // 2. Check Hotel model (Business / Hotel Owner)
  if (!accountEntity) {
    const hotel = await Hotel.findOne({
      $or: [{ ownerEmail: normalizedEmail }, { email: normalizedEmail }],
    }).populate("roomTypes");
    if (hotel) {
      const isPasswordMatch = await bcrypt.compare(password, hotel.password);
      if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid credentials.");
      }
      accountEntity = hotel;
      tokenExtraPayload = { userType: "hotel-owner", hotelId: hotel._id };

      responseUserObj = {
        id: hotel._id,
        name: hotel.ownerFullName,
        email: hotel.ownerEmail || hotel.email,
        userType: "hotel-owner",
        hotelId: hotel._id,
        hotelName: hotel.hotelName,
        roomTypes: hotel.roomTypes || [],
        permissions: "ALL",
        createdAt: hotel.createdAt,
      };
    }
  }

  // 3. Check Employee model (SaaS Employee)
  if (!accountEntity) {
    const employee = await Employee.findOne({ email: normalizedEmail }).select("+password").populate("roleId");
    if (employee) {
      const isPasswordMatch = await bcrypt.compare(password, employee.password);
      if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid credentials.");
      }
      accountEntity = employee;
      const userType = employee.userType || "Employee";
      let permissions = "ALL";

      if (userType === "Employee") {
        if (employee.roleId && employee.roleId.permissions) {
          permissions = employee.roleId.permissions instanceof Map 
            ? Object.fromEntries(employee.roleId.permissions) 
            : employee.roleId.permissions;
        } else {
          permissions = {};
        }
      }

      tokenExtraPayload = { userType };

      responseUserObj = {
        id: employee._id,
        name: `${employee.firstName || ""} ${employee.lastName || ""}`.trim(),
        email: employee.email,
        userType: userType,
        role: employee.roleId || null,
        permissions: permissions,
        createdAt: employee.createdAt,
      };
    }
  }

  // 4. Check Staff model (Hotel Staff)
  if (!accountEntity) {
    const staff = await Staff.findOne({ email: normalizedEmail }).select("+password").populate({
      path: "roleId",
      populate: { path: "permissions" }
    });
    if (staff) {
      const isPasswordMatch = await bcrypt.compare(password, staff.password);
      if (!isPasswordMatch) {
        throw new ApiError(401, "Invalid credentials.");
      }
      accountEntity = staff;

      let permissions = [];
      if (Array.isArray(staff.permissions) && staff.permissions.length > 0) {
        permissions = staff.permissions;
      } else if (staff.roleId && Array.isArray(staff.roleId.permissions)) {
        permissions = staff.roleId.permissions.map((p) =>
          typeof p === "object" ? (p.name || p.module || p._id?.toString()) : p
        );
      }

      tokenExtraPayload = {
        userType: "staff",
        hotelId: staff.hotelId,
      };

      responseUserObj = {
        id: staff._id,
        name: staff.fullName || `${staff.firstName || ""} ${staff.lastName || ""}`.trim(),
        email: staff.email,
        userType: "staff",
        hotelId: staff.hotelId,
        role: staff.roleId || null,
        permissions: permissions,
        createdAt: staff.createdAt,
      };
    }
  }

  if (!accountEntity) {
    throw new ApiError(401, "Invalid email or password.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(accountEntity, tokenExtraPayload);

  const responseData = {
    accessToken,
    refreshToken,
    user: responseUserObj,
  };

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiReaponse(200, responseData, "Login successful."));
});

export const logoutUser = asyncHandler(async (req, res, next) => {
  const userId = req.user?.id;
  if (userId) {
    await Promise.allSettled([
      User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }),
      Hotel.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }),
      Employee.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }),
      Staff.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } }),
    ]);
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiReaponse(200, {}, "User logged out successfully."));
});

export const refreshAccessToken = asyncHandler(async (req, res, next) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request. Refresh token is missing.");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET
    );

    let account = await User.findById(decodedToken?.id);
    if (!account) {
      account = await Hotel.findById(decodedToken?.id);
    }
    if (!account) {
      account = await Employee.findById(decodedToken?.id);
    }
    if (!account) {
      account = await Staff.findById(decodedToken?.id);
    }

    if (!account) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (account.refreshToken && account.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used.");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(account);

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(
        new ApiReaponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});
