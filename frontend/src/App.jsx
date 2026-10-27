
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Menu,
  X,
  ArrowRight,
  PackageCheck,
} from "lucide-react";

import Auth from "./Auth";
import Checkout from "./Checkout";
import OrderHistory from "./OrderHistory";
import AdminDashboard from "./AdminDashboard";

const API_URL =
  import.meta.env.VITE_API_URL;

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
  Boolean(localStorage.getItem("token"))
);

const [user, setUser] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
});
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [page, setPage] = useState("shop");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await axios.get(`${API_URL}/products`);
        setProducts(response.data.products);
      } catch {
        setError("Products not load. Backend server is it working?");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(products.map((p) => p.category))],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = `${product.name} ${product.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);

      if (existing) {
        return current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }



      return [...current, { ...product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const changeQuantity = (id, amount) => {
    setCart((current) =>
      current
        .map((item) =>
          item._id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart((current) => current.filter((item) => item._id !== id));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(price);

    
   if (!isLoggedIn) {
  return (
    <Auth
      onSuccess={() => {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
        setIsLoggedIn(true);
      }}
    />
  );
}

const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  setUser(null);
  setIsLoggedIn(false);
  setCart([]);
  setCartOpen(false);
};

if (page === "checkout") {
  return (
    <Checkout
      cart={cart}
      onBack={() => setPage("shop")}
      onOrderSuccess={() => {
        setCart([]);
        setPage("orders");
      }}
    />
  );
}

if (page === "orders") {
  return <OrderHistory onBack={() => setPage("shop")} />;
} 


if (page === "admin") {
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="mt-2 text-slate-600">
            Admin access is required to view this page.
          </p>
          <button
            onClick={() => setPage("shop")}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white"
          >
            Back to Shop
          </button>
        </div>
      </div>
    );
  }

  return <AdminDashboard onBack={() => setPage("shop")} />;
}

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <span className="rounded-xl bg-indigo-600 p-2 text-white">
              <ShoppingBag size={23} />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">
              Shop<span className="text-indigo-600">ora</span>
            </span>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm font-medium hover:text-indigo-600">
              Home
            </a>
            <a href="#products" className="text-sm font-medium hover:text-indigo-600">
              Products
            </a>
            <a href="#about" className="text-sm font-medium hover:text-indigo-600">
              About
            </a>
          </nav>

          <div className="flex items-center gap-2">

            {user && (
  <>
    <span className="hidden text-sm font-medium text-gray-700 sm:inline">
      Hi, {user.name}
    </span>

    <button
      onClick={handleLogout}
      className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-100"
    >
      Logout
    </button>
  

  <button
  onClick={() => setPage("orders")}
  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold hover:bg-gray-100"
>
  My Orders
</button>

{user?.role === "admin" && (
  <button
    onClick={() => setPage("admin")}
    className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
  >
    Admin Dashboard
  </button>
)}

</>
)}
            <button
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl border border-gray-200 p-3 hover:bg-gray-100"
              aria-label="Open shopping cart"
            >
              <ShoppingCart size={21} />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="rounded-xl p-3 hover:bg-gray-100 md:hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <nav className="flex flex-col gap-4 border-t px-6 py-4 md:hidden">
            <a href="#home" onClick={() => setMobileMenu(false)}>Home</a>
            <a href="#products" onClick={() => setMobileMenu(false)}>Products</a>
            <a href="#about" onClick={() => setMobileMenu(false)}>About</a>
          </nav>
        )}
      </header>

      {/* Hero */}
      <main>
        <section id="home" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-indigo-950 px-6 py-12 text-white sm:px-12 sm:py-16">
            <div className="max-w-2xl">
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm text-indigo-100">
                Your everyday shopping destination
              </span>
              <h1 className="mt-6 text-4xl font-extrabold leading-tight sm:text-6xl">
                Simple shopping.
                <br />
                <span className="text-indigo-300">Better living.</span>
              </h1>
              <p className="mt-5 max-w-lg leading-7 text-indigo-100">
                Discover useful products, compare prices and find your next
                everyday essential in one place.
              </p>
              <a
                href="#products"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-indigo-950 transition hover:bg-indigo-100"
              >
                Explore products <ArrowRight size={18} />
              </a>
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
                Our collection
              </p>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900">
                Explore products
              </h2>
              <p className="mt-2 text-gray-500">
                Find something useful for your everyday life.
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products..."
                aria-label="Search products"
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setCategory(item)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  category === item
                    ? "bg-indigo-600 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="py-16 text-center text-gray-500">Loading products...</p>
          ) : error ? (
            <p className="mt-8 rounded-xl bg-red-50 p-5 text-red-700">{error}</p>
          ) : filteredProducts.length === 0 ? (
            <p className="py-16 text-center text-gray-500">
              No products found. Try another search.
            </p>
          ) : (
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article
                  key={product._id}
                  className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      {product.category}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-gray-900">
                      {product.name}
                    </h3>
                    <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
                      {product.description}
                    </p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="text-xl font-extrabold text-gray-900">
                        {formatPrice(product.price)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* About */}
        <section id="about" className="border-t border-gray-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-12 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div>
              <h2 className="text-xl font-bold">Shopping made simple</h2>
              <p className="mt-2 text-sm text-gray-500">
                A full-stack e-commerce project built with the MERN stack.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <PackageCheck size={20} className="text-indigo-600" />
              Simple. Convenient. Responsive.
            </div>
          </div>
        </section>
      </main>

      {/* Cart drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50">
          <button
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 h-full w-full bg-black/40"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <h2 className="text-xl font-extrabold">Your cart</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {cartCount} item(s)
                </p>
              </div>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-lg p-2 hover:bg-gray-100"
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="py-16 text-center">
                  <ShoppingBag className="mx-auto text-gray-300" size={44} />
                  <p className="mt-4 font-semibold">Your cart is empty</p>
                  <p className="mt-2 text-sm text-gray-500">
                    Add a product to get started.
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item._id} className="flex gap-4 border-b pb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-20 w-20 rounded-xl bg-gray-100 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {formatPrice(item.price)}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        <button
                          onClick={() => changeQuantity(item._id, -1)}
                          className="rounded-lg border p-1.5"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => changeQuantity(item._id, 1)}
                          className="rounded-lg border p-1.5"
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="ml-auto rounded-lg p-2 text-red-500 hover:bg-red-50"
                          aria-label="Remove item"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t p-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-600">Subtotal</span>
                <span className="text-xl font-extrabold">
                  {formatPrice(total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Shipping and payment will be added in the checkout step.
              </p>
              <button
                disabled={cart.length === 0}
               onClick={() => {
                setCartOpen(false);
                setPage("checkout");
                }}
                className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3.5 font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Proceed to checkout
              </button>
            </div>
          </aside>
        </div>
      )}

      <footer className="bg-gray-950 px-4 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} ShopEase. All rights reserved.
      </footer>
    </div>
  );
}

export default App;
