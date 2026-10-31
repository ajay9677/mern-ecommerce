
import { ArrowLeft, Mail, Phone, Send } from "lucide-react";
import { useState } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

function Contact({ onBack }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSuccess("");
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/contact`,
        form
      );

      setSuccess(response.data.message);

      setForm({
        name: "",
        email: "",
        message: "",
      });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">

        <button
          onClick={onBack}
          className="mb-6 flex items-center gap-2 text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back to Shop
        </button>

        <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-10">

          <h1 className="text-3xl font-bold text-gray-900">
            Contact Us
          </h1>

          <p className="mt-3 text-gray-500">
            Have questions? We'd love to hear from you.
            Get in touch with Shopora.
          </p>

          <div className="my-8 grid gap-4 sm:grid-cols-2">

            <div className="rounded-xl bg-indigo-50 p-5">
              <Mail className="mb-3 text-indigo-600" />
              <h3 className="font-bold">Email Us</h3>
              <p className="mt-1 text-sm text-gray-600">
                ajay7667826711@gmail.com
              </p>
            </div>

            <div className="rounded-xl bg-indigo-50 p-5">
              <Phone className="mb-3 text-indigo-600" />
              <h3 className="font-bold">Customer Support</h3>
              <p className="mt-1 text-sm text-gray-600">
                +91 9677552136
              </p>
            </div>

          </div>

          <h2 className="mb-5 text-xl font-bold">
            Send us a Message
          </h2>

          {success && (
            <p className="mb-4 rounded-lg bg-green-50 p-3 text-green-700">
              {success}
            </p>
          )}

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <input
              type="text"
              required
              minLength={2}
              maxLength={100}
              placeholder="Your Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              className="w-full rounded-xl border p-3 outline-none focus:border-indigo-500"
            />

            <input
              type="email"
              required
              maxLength={254}
              placeholder="Email Address"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              className="w-full rounded-xl border p-3 outline-none focus:border-indigo-500"
            />

            <textarea
              required
              minLength={5}
              maxLength={2000}
              rows="5"
              placeholder="Write your message..."
              value={form.message}
              onChange={(e) =>
                setForm({ ...form, message: e.target.value })
              }
              className="w-full rounded-xl border p-3 outline-none focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send Message"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

export default Contact;
