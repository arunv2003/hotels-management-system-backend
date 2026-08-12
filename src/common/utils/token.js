import jwt from "jsonwebtoken";


export const generateAccessToken = (user, extraPayload = {}) => {
  return jwt.sign(
    {
      id: user._id || user.id,
      email: user.email,
      userType: extraPayload.userType || user.userType,
      hotelId: extraPayload.hotelId || user.hotelId,
      ...extraPayload,
    },
    process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};


export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id || user.id,
    },
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "10d",
    }
  );
};
