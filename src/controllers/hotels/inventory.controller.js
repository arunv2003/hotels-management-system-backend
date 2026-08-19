import { ApiError } from "../../common/utils/api.Errors.js";
import { ApiResponse } from "../../common/utils/api.Response.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { InventoryItem } from "../../models/hotels/inventoryItem.js";
import { InventoryLog } from "../../models/hotels/inventoryLog.js";

/**
 * @desc Get all inventory items for a hotel with filters directly from MongoDB
 * @route GET /api/inventory
 * @access Private
 */
export const getInventoryItems = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const { department, category, search, status, sortBy = "createdAt", sortOrder = "desc" } = req.query;

  const filter = { hotelId, isActive: true };

  // Filter by department (Support group match)
  if (department && department !== "all") {
    if (department.toLowerCase() === "housekeeping") {
      filter.department = { $in: ["Housekeeping", "Linen", "Amenities"] };
    } else if (department.toLowerCase() === "restaurant") {
      filter.department = { $in: ["Restaurant", "Kitchen"] };
    } else {
      filter.department = department;
    }
  }

  // Filter by category
  if (category && category !== "all") {
    filter.category = category;
  }

  // Search by item name or SKU
  if (search && search.trim()) {
    filter.$or = [
      { name: { $regex: search.trim(), $options: "i" } },
      { sku: { $regex: search.trim(), $options: "i" } },
      { category: { $regex: search.trim(), $options: "i" } },
      { location: { $regex: search.trim(), $options: "i" } },
      { supplier: { $regex: search.trim(), $options: "i" } },
    ];
  }

  let items = await InventoryItem.find(filter).sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 });

  // Filter by status if specified (In Stock, Low Stock, Out of Stock)
  if (status && status !== "all") {
    if (status === "out_of_stock") {
      items = items.filter((item) => item.quantity <= 0);
    } else if (status === "low_stock") {
      items = items.filter((item) => item.quantity > 0 && item.quantity <= item.minStockLevel);
    } else if (status === "in_stock") {
      items = items.filter((item) => item.quantity > item.minStockLevel);
    }
  }

  return res
    .status(200)
    .json(new ApiResponse(200, items, "Inventory items retrieved successfully."));
});

/**
 * @desc Get inventory analytics and KPI statistics
 * @route GET /api/inventory/stats
 * @access Private
 */
export const getInventoryStats = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const items = await InventoryItem.find({ hotelId, isActive: true });

  let totalItems = items.length;
  let totalQuantity = 0;
  let totalValue = 0;
  let lowStockCount = 0;
  let outOfStockCount = 0;
  let housekeepingCount = 0;
  let restaurantCount = 0;
  let linenCount = 0;

  items.forEach((item) => {
    totalQuantity += item.quantity || 0;
    totalValue += (item.quantity || 0) * (item.unitPrice || 0);

    if (item.quantity <= 0) {
      outOfStockCount++;
    } else if (item.quantity <= item.minStockLevel) {
      lowStockCount++;
    }

    const dept = (item.department || "").toLowerCase();
    if (dept === "housekeeping" || dept === "linen" || dept === "amenities") housekeepingCount++;
    else if (dept === "restaurant" || dept === "kitchen") restaurantCount++;
    else if (dept === "linen") linenCount++;
  });

  const recentLogs = await InventoryLog.find({ hotelId })
    .sort({ createdAt: -1 })
    .limit(5);

  const stats = {
    totalItems,
    totalQuantity,
    totalValue: Number(totalValue.toFixed(2)),
    lowStockCount,
    outOfStockCount,
    inStockCount: totalItems - (lowStockCount + outOfStockCount),
    housekeepingCount,
    restaurantCount,
    linenCount,
    recentLogs,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, stats, "Inventory stats fetched successfully."));
});

/**
 * @desc Get a single inventory item by ID
 * @route GET /api/inventory/:id
 * @access Private
 */
export const getInventoryItemById = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const item = await InventoryItem.findOne({ _id: id, hotelId });
  if (!item) {
    throw new ApiError(404, "Inventory item not found.");
  }

  const logs = await InventoryLog.find({ itemId: id, hotelId })
    .sort({ createdAt: -1 })
    .limit(20);

  return res.status(200).json(
    new ApiResponse(200, { item, logs }, "Inventory item details retrieved.")
  );
});

/**
 * @desc Create a new inventory item
 * @route POST /api/inventory
 * @access Private
 */
export const createInventoryItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const {
    name,
    sku,
    department = "Housekeeping",
    category = "General",
    quantity = 0,
    minStockLevel = 5,
    unitPrice = 0,
    sellingPrice = 0,
    unit = "pcs",
    location = "Main Store",
    supplier = "",
    description = "",
    image = "📦",
  } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Item name is required.");
  }

  const numericQty = Math.max(0, Number(quantity) || 0);

  const newItem = await InventoryItem.create({
    hotelId,
    name: name.trim(),
    sku: sku ? sku.trim() : `SKU-${Date.now().toString().slice(-6)}`,
    department,
    category: category.trim(),
    quantity: numericQty,
    minStockLevel: Math.max(0, Number(minStockLevel) || 5),
    unitPrice: Math.max(0, Number(unitPrice) || 0),
    sellingPrice: Math.max(0, Number(sellingPrice) || 0),
    unit,
    location: location.trim(),
    supplier: supplier.trim(),
    description: description.trim(),
    image,
    lastRestockedAt: numericQty > 0 ? new Date() : undefined,
  });

  // Create initial log if quantity > 0
  if (numericQty > 0) {
    await InventoryLog.create({
      hotelId,
      itemId: newItem._id,
      itemName: newItem.name,
      department: newItem.department,
      type: "Initial",
      quantityChanged: numericQty,
      previousQuantity: 0,
      newQuantity: numericQty,
      unit: newItem.unit,
      reason: "Initial stock registration",
      performedBy: req.user?.id || req.user?._id,
      performedByName: req.user?.name || "Hotel Staff",
    });
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newItem, "Inventory item created successfully."));
});

/**
 * @desc Update inventory item details
 * @route PUT /api/inventory/:id
 * @access Private
 */
export const updateInventoryItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const item = await InventoryItem.findOne({ _id: id, hotelId });
  if (!item) {
    throw new ApiError(404, "Inventory item not found.");
  }

  const {
    name,
    sku,
    department,
    category,
    minStockLevel,
    unitPrice,
    sellingPrice,
    unit,
    location,
    supplier,
    description,
    image,
    isActive,
  } = req.body;

  if (name !== undefined) item.name = name.trim();
  if (sku !== undefined) item.sku = sku.trim();
  if (department !== undefined) item.department = department;
  if (category !== undefined) item.category = category.trim();
  if (minStockLevel !== undefined) item.minStockLevel = Math.max(0, Number(minStockLevel));
  if (unitPrice !== undefined) item.unitPrice = Math.max(0, Number(unitPrice));
  if (sellingPrice !== undefined) item.sellingPrice = Math.max(0, Number(sellingPrice));
  if (unit !== undefined) item.unit = unit;
  if (location !== undefined) item.location = location.trim();
  if (supplier !== undefined) item.supplier = supplier.trim();
  if (description !== undefined) item.description = description;
  if (image !== undefined) item.image = image;
  if (isActive !== undefined) item.isActive = Boolean(isActive);

  await item.save();

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Inventory item updated successfully."));
});

/**
 * @desc Adjust stock quantity (Stock In, Stock Out, Consumed, Damaged, Adjustment)
 * @route POST /api/inventory/:id/adjust-stock
 * @access Private
 */
export const adjustStock = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const { type, amount, reason, reference } = req.body;

  if (!type || !amount || Number(amount) <= 0) {
    throw new ApiError(400, "Valid adjustment type and positive amount are required.");
  }

  const item = await InventoryItem.findOne({ _id: id, hotelId });
  if (!item) {
    throw new ApiError(404, "Inventory item not found.");
  }

  const previousQuantity = item.quantity;
  const changeAmount = Number(amount);
  let newQuantity = previousQuantity;
  let loggedChange = changeAmount;

  if (type === "Stock In" || type === "Returned") {
    newQuantity = previousQuantity + changeAmount;
    loggedChange = changeAmount;
    item.lastRestockedAt = new Date();
  } else if (
    type === "Stock Out" ||
    type === "Consumed" ||
    type === "Damaged"
  ) {
    if (changeAmount > previousQuantity) {
      throw new ApiError(
        400,
        `Cannot remove ${changeAmount} ${item.unit}. Current stock is only ${previousQuantity} ${item.unit}.`
      );
    }
    newQuantity = previousQuantity - changeAmount;
    loggedChange = -changeAmount;
  } else if (type === "Adjustment") {
    // Direct set or correction
    newQuantity = changeAmount;
    loggedChange = changeAmount - previousQuantity;
  } else {
    throw new ApiError(400, `Unsupported adjustment type: ${type}`);
  }

  item.quantity = Math.max(0, newQuantity);
  await item.save();

  // Create audit log
  const log = await InventoryLog.create({
    hotelId,
    itemId: item._id,
    itemName: item.name,
    department: item.department,
    type,
    quantityChanged: loggedChange,
    previousQuantity,
    newQuantity: item.quantity,
    unit: item.unit,
    reason: reason || `Manual ${type} adjustment`,
    reference: reference || "",
    performedBy: req.user?.id || req.user?._id,
    performedByName: req.user?.name || "Hotel Staff",
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      { item, log },
      `Stock successfully adjusted. New stock: ${item.quantity} ${item.unit}`
    )
  );
});

/**
 * @desc Delete an inventory item
 * @route DELETE /api/inventory/:id
 * @access Private
 */
export const deleteInventoryItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const item = await InventoryItem.findOneAndDelete({ _id: id, hotelId });
  if (!item) {
    throw new ApiError(404, "Inventory item not found.");
  }

  await InventoryLog.deleteMany({ itemId: id, hotelId });

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Inventory item deleted successfully."));
});

/**
 * @desc Get stock movement activity logs
 * @route GET /api/inventory/logs
 * @access Private
 */
export const getInventoryLogs = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const { department, type, limit = 100 } = req.query;
  const filter = { hotelId };

  if (department && department !== "all") {
    filter.department = department;
  }
  if (type && type !== "all") {
    filter.type = type;
  }

  const logs = await InventoryLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return res
    .status(200)
    .json(new ApiResponse(200, logs, "Stock logs retrieved successfully."));
});
