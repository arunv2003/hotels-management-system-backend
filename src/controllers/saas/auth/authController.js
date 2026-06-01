import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../../../models/saas/user.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiReaponse } from "../../../common/utils/api.Response.js";
import { generateAccessToken, generateRefreshToken } from "../../../common/utils/token.js";


const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access tokens.");
  }
};

export const loginSuperAdmin = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Please provide both email and password.");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid email or password.");
  }

  if (user.userType !== "super-admin") {
    throw new ApiError(403, "Access denied. You do not have super-admin privileges.");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);
  console.log("Password match result:", isPasswordMatch);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid credentials.");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

  const responseData = {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      userType: user.userType,
      createdAt: user.createdAt,
    },
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
  await User.findByIdAndUpdate(
    req.user.id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

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

    const user = await User.findById(decodedToken?.id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or already used.");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

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
