
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        name: { type: String, required: true },
        price: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"],
      default: "Pending",
    },
    paymentStatus: {
      type: String,
      enum: ["Paid"],
      default: "Paid",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["Razorpay"],
      default: "Razorpay",
    },
    razorpayOrderId: {
  type: String,
  required: true,
  unique: true,
  sparse: true,
},
razorpayPaymentId: {
  type: String,
  required: true,
  unique: true,
  sparse: true,
},
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
