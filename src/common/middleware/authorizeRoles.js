import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api.Errors.js";
import { Employee } from "../../models/saas/employee.js";
import { User } from "../../models/saas/user.js";
import permissionMapRoute from "../utils/permissionMapRoute.js";

const normalizeRoute = (url) =>
  url
    .split("?")[0]
    .replace(/\/[0-9a-fA-F]{24}(?=\/|$)/g, "/:id");

const buildRegexFromPattern = (pattern) => {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped.replace(/\\:([^/\\]+)/g, "[^/]+")}$`);
};

const findPermissionForRoute = (method, normalizedUrl) => {
  const fullPath = `${method} ${normalizedUrl}`.trim();
  let permission = permissionMapRoute[fullPath];

  if (permission) {
    return permission;
  }

  for (const [pattern, perm] of Object.entries(permissionMapRoute)) {
    const [pMethod, pUrl] = pattern.split(" ");
    if (pMethod !== method || !pUrl) continue;

    if (pUrl.includes(":")) {
      const matcher = buildRegexFromPattern(pUrl);
      if (matcher.test(normalizedUrl)) {
        return perm;
      }
    }
  }

  return null;
};

export const routeAuth = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    throw new ApiError(401, "User information not found in token");
  }

  const method = req.method;
  const originalUrl = (req.originalUrl || req.url || "").split("?")[0];
  const normalizedUrl = normalizeRoute(originalUrl);
  const permission = findPermissionForRoute(method, normalizedUrl);

  const user = await User.findById(userId).populate("role");

  if (!user) {
    return res.status(403).json({ message: "User not found or invalid user data" });
  }

  if (user.userType === "super-admin" || user.userType === "ADMIN") {
    req.global_view = true;
    return next();
  }

  if (!permission) {
    return res.status(403).json({
      message: "Route not configured for permission check",
      route: `${method} ${normalizedUrl}`,
    });
  }

  let userPermissions = user.role?.permissions;
  if (!userPermissions) {
    return res.status(403).json({ message: "Role permissions not found" });
  }

  if (userPermissions instanceof Map) {
    userPermissions = Object.fromEntries(userPermissions);
  }

  req.permissions = userPermissions;
  req.global_view =
    user.userType === "super-admin" ||
    userPermissions[permission.module]?.includes("global_view") ||
    false;

  const allowedActions = [...(userPermissions[permission.module] || [])];

  if (req.global_view && !allowedActions.includes("view")) {
    allowedActions.push("view");
  }

  if (allowedActions.includes(permission.action)) {
    return next();
  }

  return res.status(403).json({ message: "Access denied" });
});

const inferResourceFromReq = (req) => {
  const path = (req.baseUrl || req.originalUrl || req.url || "")
    .replace(/^\/api/, "")
    .split("?")[0];
  const segments = path.split("/").filter(Boolean);
  return segments[0] || null;
};

const inferActionFromReq = (req) => {
  const method = req.method?.toUpperCase();
  if (method === "POST") return "add";
  if (method === "PUT" || method === "PATCH") return "edit";
  if (method === "DELETE") return "delete";
  if (method === "GET") {
    if (req.query?.global_view === "true" || req.query?.global_view === "1") {
      return "global_view";
    }
    return "view";
  }
  return null;
};

export const verifyRolePermission = asyncHandler(async (req, res, next) => {
  const userId = req.user?._id || req.user?.id;
  const userType = req.user?.userType;

  if (!userId || !userType) {
    throw new ApiError(401, "User information not found in token");
  }

  if (userType === "super-admin") {
    return next();
  }

  if (userType !== "Employee") {
    throw new ApiError(403, "Invalid user type");
  }

  const employee = await Employee.findById(userId).populate("roleId");

  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  if (!employee.roleId) {
    throw new ApiError(403, "Employee does not have a role assigned");
  }

  const resource = inferResourceFromReq(req);
  const action = inferActionFromReq(req);

  if (!resource || !action) {
    throw new ApiError(400, "Unable to determine resource or action for permission check");
  }

  const resourcePermissions = employee.roleId.permissions?.get(resource);

  if (!resourcePermissions || !resourcePermissions.includes(action)) {
    throw new ApiError(403, `You don't have ${action} permission for ${resource}`);
  }

  return next();
});

export const quickPermissionCheck = (resource, action) => {
  return (req, res, next) => {
    const userType = req.user?.userType;
    const permissions = req.user?.permissions;

    if (userType === "super-admin") {
      return next();
    }

    if (userType !== "Employee") {
      throw new ApiError(403, "Invalid user type");
    }

    if (!permissions) {
      throw new ApiError(403, "Permissions not found in token");
    }

    const resourcePermissions = permissions[resource];
    if (!resourcePermissions || !resourcePermissions.includes(action)) {
      throw new ApiError(403, `You don't have ${action} permission for ${resource}`);
    }

    return next();
  };
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.userType !== "super-admin") {
    throw new ApiError(403, "This action is only allowed for super-admin");
  }
  next();
};

export const employeeOnly = (req, res, next) => {
  if (req.user?.userType !== "Employee") {
    throw new ApiError(403, "This action is only allowed for employees");
  }
  next();
};
