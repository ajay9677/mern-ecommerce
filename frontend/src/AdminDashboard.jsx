
import { useEffect, useState } from "react";
import {
  ArrowLeft, Package, ShoppingBag, Plus, Pencil, Trash2, RefreshCw
} from "lucide-react";
import api from "./api";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  stock: "10",
  featured: false
};

const statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function AdminDashboard({ onBack }) {
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [productResponse, orderResponse] = await Promise.all([
        api.get("/admin/products"),
        api.get("/admin/orders")
      ]);

      setProducts(productResponse.data.products || []);
      setOrders(orderResponse.data.orders || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not load admin data. Check your login and admin permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock)
      };

      if (editingId) {
        await api.put(`/admin/products/${editingId}`, payload);
        setMessage("Product updated successfully.");
      } else {
        await api.post("/admin/products", payload);
        setMessage("Product added successfully.");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save product.");
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: String(product.price ?? ""),
      category: product.category || "",
      image: product.image || "",
      stock: String(product.stock ?? 0),
      featured: Boolean(product.featured)
    });
    setTab("products");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    setError("");
    setMessage("");

    try {
      await api.delete(`/admin/products/${product._id}`);
      setMessage("Product deleted successfully.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete product.");
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setError("");
    setMessage("");

    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      setMessage("Order status updated.");
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not update order.");
    }
  };

  const money = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(amount || 0);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <p className="text-slate-600">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="mb-3 inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600"
            >
              <ArrowLeft size={17} /> Back to shop
            </button>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="mt-1 text-slate-500">Manage products and customer orders.</p>
          </div>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-slate-100"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <Package size={21} /> Total products
            </div>
            <p className="mt-3 text-3xl font-bold">{products.length}</p>
          </div>
          <div className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <ShoppingBag size={21} /> Total orders
            </div>
            <p className="mt-3 text-3xl font-bold">{orders.length}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setTab("products")}
            className={`rounded-lg px-4 py-2 font-medium ${
              tab === "products"
                ? "bg-indigo-600 text-white"
                : "border bg-white text-slate-700"
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setTab("orders")}
            className={`rounded-lg px-4 py-2 font-medium ${
              tab === "orders"
                ? "bg-indigo-600 text-white"
                : "border bg-white text-slate-700"
            }`}
          >
            Orders
          </button>
        </div>

        {message && (
          <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
            {message}
          </p>
        )}
        {error && (
          <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
            {error}
          </p>
        )}

        {tab === "products" && (
          <>
            <form
              onSubmit={saveProduct}
              className="mb-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-6"
            >
              <h2 className="mb-5 flex items-center gap-2 text-xl font-bold">
                {editingId ? <Pencil size={19} /> : <Plus size={20} />}
                {editingId ? "Edit product" : "Add new product"}
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Product name *
                  <input
                    name="name"
                    value={form.name}
                    onChange={changeField}
                    required
                    maxLength={120}
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Category *
                  <input
                    name="category"
                    value={form.category}
                    onChange={changeField}
                    required
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Price (₹) *
                  <input
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={changeField}
                    required
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700">
                  Stock quantity *
                  <input
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock}
                    onChange={changeField}
                    required
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Image URL
                  <input
                    name="image"
                    type="url"
                    value={form.image}
                    onChange={changeField}
                    placeholder="https://example.com/product.jpg"
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="text-sm font-medium text-slate-700 sm:col-span-2">
                  Description *
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={changeField}
                    required
                    rows={3}
                    className="mt-1 w-full rounded-lg border p-3 font-normal"
                  />
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={form.featured}
                    onChange={changeField}
                    className="h-4 w-4"
                  />
                  Mark as featured product
                </label>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Update product" : "Add product"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border px-5 py-3 font-semibold hover:bg-slate-50"
                  >
                    Cancel edit
                  </button>
                )}
              </div>
            </form>

            <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
              <div className="border-b p-5">
                <h2 className="text-xl font-bold">All products</h2>
              </div>

              {products.length === 0 ? (
                <p className="p-6 text-slate-500">No products found. Add your first product above.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {products.map((product) => (
                        <tr key={product._id}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              ) : (
                                <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100">
                                  <Package size={20} />
                                </div>
                              )}
                              <span className="font-semibold">{product.name}</span>
                            </div>
                          </td>
                          <td className="p-4">{product.category}</td>
                          <td className="p-4">{money(product.price)}</td>
                          <td className="p-4">{product.stock ?? 0}</td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => startEdit(product)}
                                aria-label={`Edit ${product.name}`}
                                className="rounded-lg border p-2 text-indigo-600 hover:bg-indigo-50"
                              >
                                <Pencil size={17} />
                              </button>
                              <button
                                onClick={() => deleteProduct(product)}
                                aria-label={`Delete ${product.name}`}
                                className="rounded-lg border p-2 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 size={17} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {tab === "orders" && (
          <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="border-b p-5">
              <h2 className="text-xl font-bold">Customer orders</h2>
            </div>

            {orders.length === 0 ? (
              <p className="p-6 text-slate-500">No customer orders yet.</p>
            ) : (
              <div className="space-y-4 p-4 sm:p-6">
                {orders.map((order) => (
                  <article key={order._id} className="rounded-xl border p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="break-all font-bold">Order #{order._id}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.user?.name || "Customer"} · {order.user?.email || "No email"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("en-IN")
                            : "Date unavailable"}
                        </p>
                      </div>

                      <div className="min-w-40">
                        <label className="text-xs font-medium text-slate-500">
                          Order status
                        </label>
                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateOrderStatus(order._id, event.target.value)
                          }
                          className="mt-1 w-full rounded-lg border bg-white p-2"
                        >
                          {statuses.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="my-4 space-y-2 border-y py-4">
                      {order.items?.map((item, index) => (
                        <div
                          key={`${order._id}-${item.product || index}`}
                          className="flex justify-between gap-3 text-sm"
                        >
                          <span>{item.name} × {item.quantity}</span>
                          <span>{money(item.price * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap justify-between gap-3">
                      <span className="text-sm text-slate-500">
                        Ship to: {order.shippingAddress?.fullName}, {order.shippingAddress?.city}
                      </span>
                      <p className="font-bold">Total: {money(order.totalAmount)}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
