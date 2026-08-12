import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api.Errors.js";
import { Employee } from "../../models/saas/employee.js";
import { User } from "../../models/saas/user.js";
import { Staff } from "../../models/hotels/staff.js";
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
  const userType = req.user?.userType;

  if (!userId) {
    throw new ApiError(401, "User information not found in token");
  }

  if (userType === "super-admin" || userType === "hotel-owner") {
    req.global_view = true;
    return next();
  }

  const method = req.method;
  const originalUrl = (req.originalUrl || req.url || "").split("?")[0];
  const normalizedUrl = normalizeRoute(originalUrl);
  const permission = findPermissionForRoute(method, normalizedUrl);

  if (!permission) {
    return next();
  }

  let userPermissions = null;

  if (userType === "Employee") {
    const user = await User.findById(userId).populate("role");
    if (user && user.role) {
      userPermissions = user.role.permissions;
    } else {
      const employee = await Employee.findById(userId).populate("roleId");
      if (employee && employee.roleId) {
        userPermissions = employee.roleId.permissions;
      }
    }
  }

  if (userPermissions instanceof Map) {
    userPermissions = Object.fromEntries(userPermissions);
  }

  if (!userPermissions) {
    return res.status(403).json({ message: "Role permissions not found" });
  }

  req.permissions = userPermissions;
  req.global_view =
    userPermissions[permission.module]?.includes("global_view") || false;

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

  // Super Admin (SaaS) and Hotel Owner have full access
  if (userType === "super-admin" || userType === "hotel-owner") {
    return next();
  }

  const resource = inferResourceFromReq(req);
  const action = inferActionFromReq(req);

  // If SaaS Employee
  if (userType === "Employee") {
    let permissionsObj = null;

    const user = await User.findById(userId).populate("role");
    if (user && user.role) {
      permissionsObj = user.role.permissions instanceof Map
        ? Object.fromEntries(user.role.permissions)
        : user.role.permissions;
    } else {
      const employee = await Employee.findById(userId).populate("roleId");
      if (employee && employee.roleId) {
        permissionsObj = employee.roleId.permissions instanceof Map
          ? Object.fromEntries(employee.roleId.permissions)
          : employee.roleId.permissions;
      }
    }

    if (!permissionsObj) {
      throw new ApiError(403, "Employee does not have permissions assigned");
    }

    if (!resource || !action) {
      return next();
    }

    const resourcePermissions = permissionsObj[resource] || [];

    if (!resourcePermissions.includes(action) && !resourcePermissions.includes("global_view")) {
      throw new ApiError(403, `You don't have ${action} permission for ${resource}`);
    }

    return next();
  }

  // If Hotel Staff
  if (userType === "staff") {
    const staff = await Staff.findById(userId).populate({
      path: "roleId",
      populate: { path: "permissions" }
    });

    if (!staff) {
      throw new ApiError(404, "Staff member not found");
    }

    let staffPermissions = [];
    if (Array.isArray(staff.permissions) && staff.permissions.length > 0) {
      staffPermissions = staff.permissions;
    } else if (staff.roleId && Array.isArray(staff.roleId.permissions)) {
      staffPermissions = staff.roleId.permissions.map(p =>
        typeof p === "object" ? (p.name || p.module || p._id?.toString()) : String(p)
      );
    }

    if (!resource) {
      return next();
    }

    const requiredActionKey = action ? `${resource}_${action}` : resource;
    const hasPerm = staffPermissions.some(
      (p) => String(p) === resource || String(p) === requiredActionKey || String(p) === "ALL"
    );

    if (!hasPerm) {
      throw new ApiError(403, `Staff member does not have permission for ${resource}`);
    }

    return next();
  }

  throw new ApiError(403, "Invalid user type");
});

export const quickPermissionCheck = (resource, action) => {
  return (req, res, next) => {
    const userType = req.user?.userType;
    const permissions = req.user?.permissions;

    if (userType === "super-admin" || userType === "hotel-owner") {
      return next();
    }

    if (!permissions) {
      throw new ApiError(403, "Permissions not found in token");
    }

    if (typeof permissions === "object" && !Array.isArray(permissions)) {
      const resourcePermissions = permissions[resource];
      if (!resourcePermissions || (!resourcePermissions.includes(action) && !resourcePermissions.includes("global_view"))) {
        throw new ApiError(403, `You don't have ${action} permission for ${resource}`);
      }
    } else if (Array.isArray(permissions)) {
      const reqKey = `${resource}_${action}`;
      const hasPerm = permissions.some((p) => String(p) === resource || String(p) === reqKey || String(p) === "ALL");
      if (!hasPerm) {
        throw new ApiError(403, `You don't have ${action} permission for ${resource}`);
      }
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
  if (req.user?.userType !== "Employee" && req.user?.userType !== "super-admin") {
    throw new ApiError(403, "This action is only allowed for employees");
  }
  next();
};
