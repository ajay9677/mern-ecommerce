
import { useState } from "react";
import api from "./api";

async function loadRazorpayScript() {
  if (window.Razorpay) return true;

  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Checkout({ cart, onBack, onOrderSuccess }) {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!cart.length) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);

    try {
      // Ask the backend to calculate the total and create a Razorpay order.
      const response = await api.post("/payments/create-order", {
        items: cart.map((item) => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        shippingAddress: form,
      });

      const paymentOrder = response.data;

      const scriptLoaded = await loadRazorpayScript();

      if (!scriptLoaded) {
        throw new Error(
          "Razorpay Checkout could not load. Check your internet connection and try again."
        );
      }

      const options = {
        key: paymentOrder.keyId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        name: "Shopora",
        description: "E-Commerce Order",
        order_id: paymentOrder.razorpayOrderId,

        prefill: {
          name: form.fullName,
          contact: form.phone,
        },

        theme: {
          color: "#4f46e5",
        },

        handler: async function (paymentResponse) {
          try {
            setError("");

            const verification = await api.post("/payments/verify", {
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (!verification.data?.success || !verification.data?.order) {
              throw new Error("Payment verification did not complete.");
            }

            onOrderSuccess(verification.data.order);
          } catch (err) {
            setError(
              err.response?.data?.message ||
                err.message ||
                "Payment verification failed. Please check your order status before paying again."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: function () {
            setLoading(false);
            setError(
              "Payment window closed. If you completed a payment, check your order status before trying again."
            );
          },
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", function (paymentResponse) {
        setError(
          paymentResponse.error?.description ||
            "Payment failed. Please try again."
        );
        setLoading(false);
      });

      checkout.open();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Could not start payment. Please try again."
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <button
          type="button"
          onClick={onBack}
          className="mb-6 font-semibold text-indigo-600"
        >
          ← Back to shop
        </button>

        <h1 className="mb-2 text-3xl font-extrabold">Checkout</h1>

        <p className="mb-8 text-gray-500">
          Enter your delivery details and pay securely using Razorpay Test Mode.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-sm md:col-span-2"
          >
            <h2 className="mb-4 text-xl font-bold">Shipping details</h2>

            {[
              ["fullName", "Full name"],
              ["phone", "Phone number"],
              ["address", "Full address"],
              ["city", "City"],
              ["postalCode", "Postal code"],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="mb-1 block text-sm font-medium">
                  {label}
                </label>

                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  required
                  maxLength={name === "address" ? 250 : 100}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>
            ))}

            {error && (
              <p
                role="alert"
                className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !cart.length}
              className="w-full rounded-xl bg-indigo-600 py-3 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Processing..." : `Pay ₹${total.toLocaleString("en-IN")}`}
            </button>

            <p className="text-xs text-gray-500">
              Use test credentials and payment methods provided by Razorpay.
              No real payment should be made in Test Mode.
            </p>
          </form>

          <aside className="h-fit rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold">Order summary</h2>

            {cart.map((item) => (
              <div
                key={item._id}
                className="mb-4 flex justify-between gap-3 text-sm"
              >
                <span>
                  {item.name} × {item.quantity}
                </span>

                <span className="font-semibold">
                  ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                </span>
              </div>
            ))}

            <div className="mt-4 flex justify-between border-t pt-4 font-extrabold">
              <span>Total</span>
              <span>₹{total.toLocaleString("en-IN")}</span>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Final amount is calculated and checked by the backend.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}
