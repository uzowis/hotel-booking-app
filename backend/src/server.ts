import express, { Request, Response } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

dotenv.config();

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
app.use("/api/users", usersRouter);
app.use("/api/auth", authRouter);

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
