import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiResponse } from "../../../common/utils/api.Response.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { Role } from "../../../models/saas/roles.js";

const VALID_ACTIONS = ["view", "add", "edit", "delete", "global_view"];

const transformPermissions = (permissions = {}) => {
  const groupedPermissions = {};

  for (const key in permissions) {
    const value = permissions[key];

    if (!value) continue;

    if (key.endsWith("_global_view")) {
      const module = key.replace("_global_view", "");

      if (!groupedPermissions[module]) {
        groupedPermissions[module] = [];
      }

      groupedPermissions[module].push("global_view");

      continue;
    }

    const lastIndex = key.lastIndexOf("_");

    if (lastIndex === -1) continue;

    const module = key.substring(0, lastIndex);

    const action = key.substring(lastIndex + 1);

    if (!VALID_ACTIONS.includes(action)) continue;

    if (!groupedPermissions[module]) {
      groupedPermissions[module] = [];
    }

    groupedPermissions[module].push(action);
  }

  return groupedPermissions;
};

const validatePermissions = (permissions) => {
  if (!permissions || typeof permissions !== "object") return;

  const entries =
    permissions instanceof Map
      ? [...permissions.entries()]
      : Object.entries(permissions);

  for (const [module, actions] of entries) {
    if (!module || typeof module !== "string") {
      throw new ApiError(400, "Invalid permission module name.");
    }

    if (!Array.isArray(actions)) {
      throw new ApiError(
        400,
        `Permissions for module "${module}" must be an array.`,
      );
    }

    const uniqueActions = [...new Set(actions)];

    for (const action of uniqueActions) {
      if (!VALID_ACTIONS.includes(action)) {
        throw new ApiError(
          400,
          `Invalid action "${action}" in module "${module}". Allowed: ${VALID_ACTIONS.join(
            ", ",
          )}`,
        );
      }
    }

    permissions[module] = uniqueActions;
  }
};

export const createRole = asyncHandler(async (req, res) => {
  const { name, permissions } = req.body;
  const userId = req.user?._id || req.user?.id;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Role name is required.");
  }

  const roleName = name.trim();

  const existing = await Role.findOne({
    name: {
      $regex: `^${roleName}$`,
      $options: "i",
    },
  });

  if (existing) {
    throw new ApiError(409, `Role "${roleName}" already exists.`);
  }

  const formattedPermissions = transformPermissions(permissions);

  validatePermissions(formattedPermissions);

  const role = await Role.create({
    name: roleName,
    permissions: formattedPermissions,
    createdBy: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, role, "Role created successfully."));
});

export const getAllRoles = asyncHandler(async (req, res) => {
  const roles = await Role.find().sort({
    createdAt: -1,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, roles, "Roles fetched successfully."));
});

export const getRoleById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findById(id);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, role, "Role fetched successfully."));
});

export const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { name, permissions } = req.body;
  const userId = req.user?._id || req.user?.id;
  const role = await Role.findById(id);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  if (name && name.trim() !== role.name) {
    const duplicate = await Role.findOne({
      _id: { $ne: id },

      name: {
        $regex: `^${name.trim()}$`,
        $options: "i",
      },
    });

    if (duplicate) {
      throw new ApiError(409, `Role "${name.trim()}" already exists.`);
    }

    role.name = name.trim();
    role.updatedBy = userId;
  }

  if (permissions !== undefined) {
    const formattedPermissions = transformPermissions(permissions);

    validatePermissions(formattedPermissions);

    role.permissions = formattedPermissions;
    role.updatedBy = userId;
  }

  await role.save();

  return res
    .status(200)
    .json(new ApiResponse(200, role, "Role updated successfully."));
});

export const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const role = await Role.findByIdAndDelete(id);

  if (!role) {
    throw new ApiError(404, "Role not found.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Role deleted successfully."));
});
