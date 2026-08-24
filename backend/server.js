import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import retailerRoutes from "./routes/retailerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import goldSipRoutes from "./routes/goldSipRoutes.js";
import { notFoundHandler, globalErrorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Jewellery API is running",
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customer/products", productRoutes);
app.use("/api/marketplace/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/manufacturer/orders", orderRoutes);
app.use("/api/manufacturer", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/retailers", retailerRoutes);
app.use("/api/retailer", retailerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gold-sip", goldSipRoutes);
app.use("/api/sip", goldSipRoutes);
app.use("/api/customer/gold-sip", goldSipRoutes);
app.use("/api/customer/gold-wallet", goldSipRoutes);
app.use("/api/customer/gold-transactions", goldSipRoutes);
app.use("/api/gold/price", goldSipRoutes);
app.use("/api/gold/prices", goldSipRoutes);

// Register centralized 404 & 500 error middlewares
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});