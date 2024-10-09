import express, { Request, Response } from "express";
import { check, validationResult } from "express-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/users";
import verifyToken from "../middleware/auth";

const authRoute = express.Router();

// Login User
authRoute.post(
  "/login",
  [
    check("email", "Enter valid email address").isString(),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Password must be more that 6 charaters")
      .isString(),
  ],
  async (req: Request, res: Response) => {
    // Input validate users details
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array() });
    }

    // Check if the user exists using email
    try {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(400).json({ message: "Invalid login details" });
      }

      // compare the user password with the password saved in DB
      const passwordMatch = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (!passwordMatch) {
        return res.status(400).json({ message: "Invalid login details" });
      }

      // generate auth token
      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET_KEY as string,
        { expiresIn: "1d" }
      );

      // store token in a cookie
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 86400000,
      });

      return res.status(200).json({ message: " Login was successful" });
    } catch (error) {
      console.log(error);
      res.status(500).send("Something Went wrong");
    }
  }
);

// Validate Token
authRoute.get("/validate-token", verifyToken, (req: Request,  res: Response)=>{
  res.status(200).send({userId: req.userId});
})


// Logout User
authRoute.post("/logout", (req: Request, res: Response) =>{
  res.cookie("auth_token", "", {
    expires : new Date(0)
  });
  res.send("Logout was successful!").status(200);
})

export default authRoute;

// The user registers
// user details saved in DB

// path = ./routes/auth.ts
// - User Login
// User enters login details
// Input validate users details
// Check if the user exists using email
// compare the user password with the password saved in DB
// generate auth token
// store token in a cookie

// path = ./middleware/auth.ts
// - Authentication middleware to verify token.
// grab the token from req.cookie.
// use jwt.verify to verify the token
// assign the decoded userId to req.userId
// if valid call the nextFunction.
