
import { useEffect, useState } from "react";
import api from "./api";

export default function OrderHistory({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/orders/my-orders")
      .then((response) => setOrders(response.data.orders || []))
      .catch((err) => {
        setError(err.response?.data?.message || "Could not load orders.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <button onClick={onBack} className="mb-6 font-semibold text-indigo-600">
          ← Back to shop
        </button>

        <h1 className="mb-8 text-3xl font-extrabold">My Orders</h1>

        {loading && <p>Loading your orders...</p>}
        {error && <p className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}

        {!loading && !error && orders.length === 0 && (
          <div className="rounded-2xl bg-white p-8 text-center">
            <p className="font-semibold">No orders yet.</p>
            <p className="mt-2 text-gray-500">Your orders will appear here.</p>
          </div>
        )}

        <div className="space-y-5">
          {orders.map((order) => (
            <article key={order._id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3 border-b pb-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="break-all font-semibold">{order._id}</p>
                </div>
                <span className="h-fit rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                  {order.status}
                </span>
              </div>

              <div className="space-y-3 py-4">
                {order.items.map((item, index) => (
                  <div key={`${order._id}-${index}`} className="flex justify-between gap-3">
                    <span>{item.name} × {item.quantity}</span>
                    <span>₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between border-t pt-4 font-extrabold">
                <span>Total</span>
                <span>₹{order.totalAmount.toLocaleString("en-IN")}</span>
              </div>

              <p className="mt-3 text-sm text-gray-500">
                Ordered on: {new Date(order.createdAt).toLocaleDateString("en-IN")}
              </p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
