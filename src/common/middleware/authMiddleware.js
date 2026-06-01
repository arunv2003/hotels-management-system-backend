import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api.Errors.js";

export const verifyToken = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    (req.headers.authorization && req.headers.authorization.startsWith("Bearer")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    throw new ApiError(401, "Not authorized, no token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    console.error("JWT Token verification error:", error);
    throw new ApiError(401, "Not authorized, token failed.");
  }
});

export const restrictTo = (...userTypes) => {
  return (req, res, next) => {
    if (!req.user || !userTypes.includes(req.user.userType)) {
      throw new ApiError(403, `Access denied. Restricted to: [${userTypes.join(", ")}]`);
    }
    next();
  };
};
