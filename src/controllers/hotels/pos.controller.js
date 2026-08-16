import { ApiError } from "../../common/utils/api.Errors.js";
import { ApiResponse } from "../../common/utils/api.Response.js";
import { asyncHandler } from "../../common/utils/asyncHandler.js";
import { MenuItem } from "../../models/hotels/menuItem.js";
import { POSOrder } from "../../models/hotels/posOrder.js";

/**
 * @desc Get all menu items for the hotel directly from DB
 * @route GET /api/pos/items
 * @access Private
 */
export const getMenuItems = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const items = await MenuItem.find({ hotelId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, items, "POS menu items fetched successfully."));
});

/**
 * @desc Create a new menu item
 * @route POST /api/pos/items
 * @access Private
 */
export const createMenuItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const { name, category, price, quantity, tax, description, image, popular, isVeg, isAvailable } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Item name is required.");
  }
  if (price === undefined || price < 0) {
    throw new ApiError(400, "Valid item price is required.");
  }

  const newItem = await MenuItem.create({
    hotelId,
    name: name.trim(),
    category: category || "food",
    price: Number(price),
    quantity: quantity !== undefined ? Number(quantity) : 0,
    tax: tax !== undefined ? Number(tax) : 5,
    description: description || "",
    image: image || "🍽️",
    popular: Boolean(popular),
    isVeg: isVeg !== undefined ? Boolean(isVeg) : true,
    isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newItem, "Menu item created successfully."));
});

/**
 * @desc Update menu item
 * @route PUT /api/pos/items/:id
 * @access Private
 */
export const updateMenuItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const item = await MenuItem.findOne({ _id: id, hotelId });
  if (!item) {
    throw new ApiError(404, "Menu item not found.");
  }

  const { name, category, price, quantity, tax, description, image, popular, isVeg, isAvailable } = req.body;

  if (name !== undefined) item.name = name.trim();
  if (category !== undefined) item.category = category;
  if (price !== undefined) item.price = Number(price);
  if (quantity !== undefined) item.quantity = Number(quantity);
  if (tax !== undefined) item.tax = Number(tax);
  if (description !== undefined) item.description = description;
  if (image !== undefined) item.image = image;
  if (popular !== undefined) item.popular = Boolean(popular);
  if (isVeg !== undefined) item.isVeg = Boolean(isVeg);
  if (isAvailable !== undefined) item.isAvailable = Boolean(isAvailable);

  await item.save();

  return res
    .status(200)
    .json(new ApiResponse(200, item, "Menu item updated successfully."));
});

/**
 * @desc Delete menu item
 * @route DELETE /api/pos/items/:id
 * @access Private
 */
export const deleteMenuItem = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;

  const deleted = await MenuItem.findOneAndDelete({ _id: id, hotelId });
  if (!deleted) {
    throw new ApiError(404, "Menu item not found or unauthorized.");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deleted, "Menu item deleted successfully."));
});

/**
 * @desc Create POS Order (Checkout)
 * @route POST /api/pos/orders
 * @access Private
 */
export const createPOSOrder = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const { items, subTotal, tax, discount, grandTotal, guestRoom, tableNumber, orderType, paymentMethod } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Order must contain at least one item.");
  }

  const mappedItems = items.map((i) => ({
    menuItem: i._id || i.id,
    name: i.name,
    quantity: i.qty || i.quantity || 1,
    price: i.price,
    tax: i.tax || 0,
    image: i.image || "🍽️",
  }));

  const order = await POSOrder.create({
    hotelId,
    guestRoom: guestRoom || "",
    tableNumber: tableNumber || "",
    items: mappedItems,
    subTotal: Number(subTotal) || 0,
    tax: Number(tax) || 0,
    discount: Number(discount) || 0,
    grandTotal: Number(grandTotal) || 0,
    orderType: orderType || "Direct",
    paymentMethod: paymentMethod || "cash",
    paymentStatus: paymentMethod === "room_charge" ? "ChargedToRoom" : "Paid",
    orderStatus: "Received",
  });

  // Automatically decrement quantity (stock) in MongoDB for each ordered item
  for (const item of mappedItems) {
    if (item.menuItem) {
      await MenuItem.updateOne(
        { _id: item.menuItem, hotelId },
        { $inc: { quantity: -item.quantity } }
      );
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, order, "POS Order created successfully."));
});

/**
 * @desc Get POS Orders history for hotel
 * @route GET /api/pos/orders
 * @access Private
 */
export const getPOSOrders = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  if (!hotelId) {
    throw new ApiError(400, "Hotel context is missing.");
  }

  const orders = await POSOrder.find({ hotelId }).sort({ createdAt: -1 }).limit(100);

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "POS orders fetched successfully."));
});

/**
 * @desc Update POS Order status
 * @route PATCH /api/pos/orders/:id/status
 * @access Private
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const hotelId = req.user?.hotelId || req.user?.id;
  const { id } = req.params;
  const { orderStatus, paymentStatus } = req.body;

  const order = await POSOrder.findOne({ _id: id, hotelId });
  if (!order) {
    throw new ApiError(404, "Order not found.");
  }

  if (orderStatus) order.orderStatus = orderStatus;
  if (paymentStatus) order.paymentStatus = paymentStatus;

  await order.save();

  return res
    .status(200)
    .json(new ApiResponse(200, order, "Order status updated successfully."));
});
