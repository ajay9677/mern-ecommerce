
require("dotenv").config();

const mongoose = require("mongoose");
const Product = require("./models/Product");

const sampleProducts = [
  {
    name: "Wireless Headphones",
    description: "Comfortable wireless headphones for everyday listening.",
    price: 1499,
    category: "Electronics",
    image: "https://placehold.co/600x400?text=Headphones",
    stock: 20,
    featured: true,
  },
  {
    name: "Classic Backpack",
    description: "A practical backpack for work, college and travel.",
    price: 999,
    category: "Accessories",
    image: "https://placehold.co/600x400?text=Backpack",
    stock: 15,
    featured: true,
  },
  {
    name: "Smart Watch",
    description: "A stylish smartwatch for your everyday routine.",
    price: 2499,
    category: "Electronics",
    image: "https://placehold.co/600x400?text=Smart+Watch",
    stock: 10,
    featured: true,
  },
  {
    name: "Running Shoes",
    description: "Lightweight shoes for walking and daily activities.",
    price: 1799,
    category: "Fashion",
    image: "https://placehold.co/600x400?text=Running+Shoes",
    stock: 12,
    featured: false,
  },
  {
    name: "Travel Bottle",
    description: "A reusable bottle for work, college and travel.",
    price: 399,
    category: "Accessories",
    image: "https://placehold.co/600x400?text=Travel+Bottle",
    stock: 30,
    featured: false,
  },
  {
    name: "Cotton T-Shirt",
    description: "A comfortable everyday cotton T-shirt.",
    price: 599,
    category: "Fashion",
    image: "https://placehold.co/600x400?text=T-Shirt",
    stock: 25,
    featured: false,
  },
];

async function seedProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);

    console.log("Sample products added successfully!");
    console.log(`Total products: ${sampleProducts.length}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

seedProducts();
