import { asyncHandler } from "../../../common/utils/asyncHandler.js";
import { ApiError } from "../../../common/utils/api.Errors.js";
import { ApiReaponse } from "../../../common/utils/api.Response.js";
import { Employee } from "../../../models/saas/employee.js";
import bcrypt from "bcryptjs";
const generateEmployeeCode = async () => {
  let employeeCode;
  let exists = true;

  while (exists) {
    employeeCode = `EMP-${Math.floor(100000 + Math.random() * 900000)}`;

    exists = await Employee.exists({ employeeCode });
  }

  return employeeCode;
};

const normalizeDocuments = (documents) => {
  if (!documents) {
    return [];
  }

  if (Array.isArray(documents)) {
    return documents.map((doc) => {
      if (!doc) return null;
      return {
        name: doc.name || doc.title || "document",
        url: doc.url || doc.cloudUrl || doc,
      };
    }).filter(Boolean);
  }

  if (typeof documents === "object") {
    return Object.entries(documents)
      .map(([key, value]) => {
        if (!value) return null;
        if (typeof value === "string") {
          return { name: key, url: value };
        }
        return {
          name: key,
          url: value.cloudUrl || value.url || null,
        };
      })
      .filter((doc) => doc && doc.url);
  }

  return [];
};

export const createEmployee = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    gender,
    dob,
    email,
    phone,
    alternatePhone,
    password,
    profileImage,
    address,
    city,
    state,
    country,
    pincode,
    roleId,
    department,
    designation,
    joiningDate,
    employmentType,
    shift,
    salaryType,
    salary,
    aadharNumber,
    panNumber,
    documents,
  } = req.body;

  const employeeExists = await Employee.findOne({ email });
  if (employeeExists) {
    throw new ApiError(400, "Employee with this email address already exists");
  }
  if (phone) {
    const phoneExists = await Employee.findOne({ phone });
    if (phoneExists) {
      throw new ApiError(400, "Employee with this phone number already exists");
    }
  }
  if (aadharNumber) {
    const aadharExists = await Employee.findOne({ aadharNumber });
    if (aadharExists) {
      throw new ApiError(
        400,
        "Employee with this aadhar number already exists",
      );
    }
  }
  if (panNumber) {
    const panExists = await Employee.findOne({ panNumber });
    if (panExists) {
      throw new ApiError(400, "Employee with this pan number already exists");
    }
  }
  if (
    !firstName ||
    !lastName ||
    !gender ||
    !dob ||
    !email ||
    !phone ||
    !password ||
    !address ||
    !city ||
    !state ||
    !country ||
    !pincode ||
    !roleId ||
    !department ||
    !designation ||
    !joiningDate ||
    !employmentType ||
    !shift ||
    !salaryType ||
    !salary ||
    !aadharNumber ||
    !panNumber ||
    !documents
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const employeeCode = await generateEmployeeCode();

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const normalizedDocuments = normalizeDocuments(documents);

  const employee = await Employee.create({
    firstName,
    lastName,
    gender,
    dob,
    email,
    phone,
    alternatePhone,
    password: hashedPassword,
    profileImage,
    address,
    city,
    state,
    country,
    pincode,
    employeeCode,
    roleId,
    department,
    designation,
    joiningDate,
    employmentType,
    shift,
    salaryType,
    salary,
    aadharNumber,
    panNumber,
    documents: normalizedDocuments,
  });
  return res
    .status(201)
    .json(new ApiReaponse(201, employee, "Employee created successfully"));
});

export const getAllEmployees = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { employeeCode: { $regex: search, $options: "i" } },
      { department: { $regex: search, $options: "i" } },
    ];
  }
  const employees = await Employee.find(query).populate([
    {
      path: "roleId",
      select: "name",
      populate: {
        path: "permissions",
        select: "name",
      },
    },
  ]);
  return res
    .status(200)
    .json(new ApiReaponse(200, employees, "Employees fetched successfully"));
});

export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employee = await Employee.findById(id).populate(
    "roleId",
    "name permissions",
  );
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }
  return res
    .status(200)
    .json(new ApiReaponse(200, employee, "Employee fetched successfully"));
});

export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    gender,
    dob,
    email,
    phone,
    alternatePhone,
    password,
    profileImage,
    address,
    city,
    state,
    country,
    pincode,
    roleId,
    department,
    designation,
    joiningDate,
    employmentType,
    shift,
    salaryType,
    salary,
    aadharNumber,
    panNumber,
    documents,
  } = req.body;

  const employee = await Employee.findById(id);
  if (!employee) {
    return res.status(404).json(new ApiError(404, "Employee not found"));
  }
  if (email && email !== employee.email) {
    const emailExists = await Employee.findOne({ email });
    if (emailExists) {
      return res
        .status(400)
        .json(
          new ApiError(400, "Employee with this email address already exists"),
        );
    }
  }
  if (phone && phone !== employee.phone) {
    const phoneExists = await Employee.findOne({ phone });
    if (phoneExists) {
      return res
        .status(400)
        .json(
          new ApiError(400, "Employee with this phone number already exists"),
        );
    }
  }

  if (aadharNumber && aadharNumber !== employee.aadharNumber) {
    const aadharExists = await Employee.findOne({ aadharNumber });
    if (aadharExists) {
      return res
        .status(400)
        .json(
          new ApiError(400, "Employee with this aadhar number already exists"),
        );
    }
  }
  if (panNumber && panNumber !== employee.panNumber) {
    const panExists = await Employee.findOne({ panNumber });
    if (panExists) {
      return res
        .status(400)
        .json(
          new ApiError(400, "Employee with this pan number already exists"),
        );
    }
  }
  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    employee.password = hashedPassword;
  }

  const normalizedDocuments = documents ? normalizeDocuments(documents) : employee.documents;

  const updatedEmployee = await Employee.findByIdAndUpdate(
    id,
    {
      firstName,
      lastName,
      gender,
      dob,
      email,
      phone,
      alternatePhone,
      password: employee.password,
      profileImage,
      address,
      city,
      state,
      country,
      pincode,
      roleId,
      department,
      designation,
      joiningDate,
      employmentType,
      shift,
      salaryType,
      salary,
      aadharNumber,
      panNumber,
      documents: normalizedDocuments,
    },
    { new: true },
  ).populate("roleId", "name permissions");
  return res
    .status(200)
    .json(
      new ApiReaponse(200, updatedEmployee, "Employee updated successfully"),
    );
});

export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const employee = await Employee.findByIdAndDelete(id);
  if (!employee) {
    return res.status(404).json(new ApiError(404, "Employee not found"));
  }
  return res
    .status(200)
    .json(new ApiReaponse(200, null, "Employee deleted successfully"));
});
