import { ApiResponse } from "../../../common/utils/api.Response.js";
import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { Announcement } from "../../../models/saas/anouncements.js";
import { ApiError } from "../../../common/utils/api.Errors.js";

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, content, publishDate, audience, type, status } = req.body;
  if (!title) {
    throw new ApiError(400, "Please provide announcement title");
  }
  if (!content) {
    throw new ApiError(400, "Please provide announcement content");
  }
  if (!publishDate) {
    throw new ApiError(400, "Please provide announcement publish date");
  }
  if (!audience) {
    throw new ApiError(400, "Please provide announcement audience");
  }
  if (!type) {
    throw new ApiError(400, "Please provide announcement type");
  }
  if (!status) {
    throw new ApiError(400, "Please provide announcement status");
  }
  const announcement = await Announcement.create({
    title,
    content,
    publishDate,
    audience,
    type,
    status,
  });
  return res
    .status(201)
    .json(
      new ApiResponse(201, announcement, "Announcement created successfully"),
    );
});

export const getAnnouncement = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find().sort({ createdAt: -1 });
  return res
    .status(200)
    .json(
      new ApiResponse(200, announcements, "Announcements fetched successfully"),
    );
});

export const getAnnouncementById = asyncHandler(async (req, res) => {
  const announcementId = req.params.id;
  if (!announcementId) {
    throw new ApiError(400, "Please provide announcement id");
  }
  const announcement = await Announcement.findById(announcementId);
  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, announcement, "Announcement fetched successfully"),
    );
});

export const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcementId = req.params.id;
  if (!announcementId) {
    throw new ApiError(400, "Please provide announcement id");
  }

  const existing = await Announcement.findById(announcementId);
  if (!existing) {
    throw new ApiError(404, "Announcement not found");
  }

  const { title, content, publishDate, audience, type, status } = req.body;
  if (!title) {
    throw new ApiError(400, "Please provide announcement title");
  }
  if (!content) {
    throw new ApiError(400, "Please provide announcement content");
  }
  if (!publishDate) {
    throw new ApiError(400, "Please provide announcement publish date");
  }
  if (!audience) {
    throw new ApiError(400, "Please provide announcement audience");
  }
  if (!type) {
    throw new ApiError(400, "Please provide announcement type");
  }
  if (!status) {
    throw new ApiError(400, "Please provide announcement status");
  }

  const announcement = await Announcement.findByIdAndUpdate(
    announcementId,
    {
      title,
      content,
      publishDate,
      audience,
      type,
      status,
    },
    {
      new: true,
    },
  );
  return res
    .status(200)
    .json(
      new ApiResponse(200, announcement, "Announcement updated successfully"),
    );
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcementId = req.params.id;
  if (!announcementId) {
    throw new ApiError(400, "Please provide announcement id");
  }
  const announcement = await Announcement.findByIdAndDelete(announcementId);
  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, announcement, "Announcement deleted successfully"),
    );
});

export const addClicks = asyncHandler(async (req, res) => {
  const announcementId = req.params.id;
  if (!announcementId) {
    throw new ApiError(400, "Please provide announcement id");
  }
  const announcement = await Announcement.findByIdAndUpdate(
    announcementId,
    {
      $inc: { clicks: 1 },
    },
    {
      new: true,
    },
  );
  if (!announcement) {
    throw new ApiError(404, "Announcement not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, announcement, "Announcement clicks updated successfully"),
    );
});