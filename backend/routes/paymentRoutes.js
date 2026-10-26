
const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const Product = require("../models/Product");
const Order = require("../models/Order");
const PaymentAttempt = require("../models/PaymentAttempt");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

function getRazorpay() {
  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay API keys are missing in backend environment.");
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

function validateShippingAddress(address) {
  const fields = ["fullName", "phone", "address", "city", "postalCode"];

  return (
    address &&
    fields.every(
      (field) =>
        typeof address[field] === "string" &&
        address[field].trim().length > 0
    )
  );
}

// POST /api/payments/create-order
router.post("/create-order", protect, async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty.",
      });
    }

    if (!validateShippingAddress(shippingAddress)) {
      return res.status(400).json({
        success: false,
        message: "Please provide complete shipping details.",
      });
    }

    // Combine duplicate product IDs and validate quantities.
    const quantities = new Map();

    for (const item of items) {
      if (
        !item.productId ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isSafeInteger(item.quantity) ||
        item.quantity < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid product or quantity in your cart.",
        });
      }

      const id = String(item.productId);
      const quantity = (quantities.get(id) || 0) + item.quantity;

      if (!Number.isSafeInteger(quantity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid product quantity.",
        });
      }

      quantities.set(id, quantity);
    }

    const paymentItems = [];
    let totalAmount = 0;

    for (const [productId, quantity] of quantities.entries()) {
      const product = await Product.findById(productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "A product in your cart no longer exists.",
        });
      }

      if (product.stock < quantity) {
        return res.status(409).json({
          success: false,
          message: `Not enough stock for "${product.name}".`,
        });
      }

      paymentItems.push({ productId, quantity });
      totalAmount += product.price * quantity;
    }

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      !Number.isSafeInteger(Math.round(totalAmount * 100))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order total.",
      });
    }

    // Razorpay expects the amount in paise.
    const amountInPaise = Math.round(totalAmount * 100);
    const razorpay = getRazorpay();

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `rcpt_${new mongoose.Types.ObjectId().toString()}`,
      notes: {
        userId: String(req.user.id),
      },
    });

    const attempt = await PaymentAttempt.create({
      user: req.user.id,
      items: paymentItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        postalCode: shippingAddress.postalCode.trim(),
      },
      totalAmount,
      razorpayOrderId: razorpayOrder.id,
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      attemptId: attempt._id,
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not start payment. Please try again.",
    });
  }
});

// POST /api/payments/verify
router.post("/verify", protect, async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  if (
    typeof razorpay_order_id !== "string" ||
    typeof razorpay_payment_id !== "string" ||
    typeof razorpay_signature !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Payment verification details are incomplete.",
    });
  }

  let session;

  try {
    const attempt = await PaymentAttempt.findOne({
      razorpayOrderId: razorpay_order_id,
      user: req.user.id,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Payment order was not found for this account.",
      });
    }

    // Make verification idempotent: don't create the same order twice.
    if (attempt.status === "Paid" && attempt.order) {
      const existingOrder = await Order.findById(attempt.order);

      return res.json({
        success: true,
        message: "Payment was already verified.",
        order: existingOrder,
      });
    }

    if (attempt.status !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "This payment attempt is no longer pending.",
      });
    }

    // Verify the signature using the order ID stored by the server.
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${attempt.razorpayOrderId}|${razorpay_payment_id}`)
      .digest("hex");

    const suppliedBuffer = Buffer.from(razorpay_signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      suppliedBuffer.length !== expectedBuffer.length ||
      !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    // Also check the payment status and amount with Razorpay.
    const razorpay = getRazorpay();
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== attempt.razorpayOrderId ||
      payment.amount !== Math.round(attempt.totalAmount * 100) ||
      payment.currency !== "INR" ||
      payment.status !== "captured"
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Payment is not captured yet. Please check the payment status before retrying.",
      });
    }

    session = await mongoose.startSession();
    let createdOrder;

    await session.withTransaction(async () => {
      const currentAttempt = await PaymentAttempt.findOne({
        _id: attempt._id,
        status: "Pending",
      }).session(session);

      if (!currentAttempt) {
        const error = new Error("Payment attempt has already been processed.");
        error.statusCode = 409;
        throw error;
      }

      const orderItems = [];
      let verifiedTotal = 0;

      for (const item of currentAttempt.items) {
        const product = await Product.findById(item.productId).session(session);

        if (!product) {
          const error = new Error("A product in your cart no longer exists.");
          error.statusCode = 409;
          throw error;
        }

        // Reduce stock only after successful payment verification.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            stock: { $gte: item.quantity },
          },
          {
            $inc: { stock: -item.quantity },
          },
          {
            new: true,
            session,
            runValidators: true,
          }
        );

        if (!updatedProduct) {
          const error = new Error(
            `Not enough stock for "${product.name}".`
          );
          error.statusCode = 409;
          throw error;
        }

        verifiedTotal += updatedProduct.price * item.quantity;

        orderItems.push({
          product: updatedProduct._id,
          name: updatedProduct.name,
          price: updatedProduct.price,
          quantity: item.quantity,
        });
      }

      if (Math.round(verifiedTotal * 100) !== payment.amount) {
        const error = new Error(
          "The product total changed. The payment needs review."
        );
        error.statusCode = 409;
        throw error;
      }

      const [order] = await Order.create(
        [
          {
            user: currentAttempt.user,
            items: orderItems,
            shippingAddress: currentAttempt.shippingAddress,
            totalAmount: verifiedTotal,
            status: "Pending",
            paymentStatus: "Paid",
            paymentMethod: "Razorpay",
            razorpayOrderId: currentAttempt.razorpayOrderId,
            razorpayPaymentId: razorpay_payment_id,
          },
        ],
        { session }
      );

      currentAttempt.status = "Paid";
      currentAttempt.razorpayPaymentId = razorpay_payment_id;
      currentAttempt.order = order._id;
      await currentAttempt.save({ session });

      createdOrder = order;
    });

    return res.json({
      success: true,
      message: "Payment verified and order placed successfully.",
      order: createdOrder,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Could not verify payment. Check the payment status before trying again.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
});

module.exports = router;
