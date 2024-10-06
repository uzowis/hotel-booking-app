import express, { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import authRoute from "./routes/auth";
import usersRoute from "./routes/users";
import { v2 as cloudinary } from "cloudinary";
import hotelRoute from "./routes/my-hotels";

// DotEnv Configuration
dotenv.config();

// Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

mongoose.connect(
  (process.env.MONGODB_URL as string) ||
    "mongodb://localhost:27017/hotel-booking"
);

const app = express();
app.use(
  cors({
    origin: "http://localhost:5174",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 8002;

// Connecting routers to the express server
app.use("/api/users", usersRoute);
app.use("/api/auth", authRoute);
app.use("/api/my-hotels", hotelRoute)

app.use(express.static(path.join(__dirname, "../../frontend/dist")));

app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist/index.html"));
});

app.get("/", (req: Request, res: Response) => {
  res.send("<h1>Welcome to the Barbican! </h1>").status(200);
});

app.listen(PORT, () => {
  console.log(`Server Listening at Port ${PORT}...`);
});
