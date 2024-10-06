import { check, validationResult } from "express-validator";
import User from "../models/users";
import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/auth";

const usersRoute = express.Router();

usersRoute.get(
  "/me",
  verifyToken,
  async (req: Request, res: Response) => {
    // Extract the user id from the req object
    const userId = req.userId;

    try {
      // fetch user from db using userId
      const user = await User.findOne({ _id: userId }, "-password");

      return res.status(200).json(user);
    } catch (error) {
      console.log(error);
      res.status(401).send("Unauthorized");
    }
  }
);

// Get all registered Users
usersRoute.get("/", async (req: Request, res: Response) => {
  try {
    const user = await User.find({}, "-password");
    res.status(200).json(user);
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: "Something went wrong!",
    });
  }
});

// Register new User
usersRoute.post(
  "/register",
  [
    // Validate User input
    check("firstName", "First name is required").isString(),
    check("lastName", "Lastname is required").isString(),
    check("email", "Email is requred").isEmail(),
    check("password")
      .isLength({
        min: 6,
      })
      .withMessage("Password must be 6 characters or more")
      .isString()
      .withMessage("Password is required"),
  ],
  async (req: Request, res: Response) => {
    // Check if validation return errors
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    try {
      // check if user already exists
      const email = await User.findOne({ email: req.body.email });
      if (email) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Instantiate a User and save new user
      const user = new User(req.body);
      await user.save();

      //Generate user token
      const token = jwt.sign(
        { user_id: user.id },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "1d" }
      );

      // Store the token in the cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400,
      });
      return res.status(200).json(user.id);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Something went wrong" });
    }
  }
);

export default usersRoute;
