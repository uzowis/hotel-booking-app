"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongo_1 = __importDefault(require("../models/users/mongo"));
const auth_1 = __importDefault(require("../middleware/auth"));
const authRouter = express_1.default.Router();
// Login User
authRouter.post("/login", [
    (0, express_validator_1.check)("email", "Enter valid email address").isString(),
    (0, express_validator_1.check)("password")
        .isLength({ min: 6 })
        .withMessage("Password must be more that 6 charaters")
        .isString(),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Input validate users details
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    // Check if the user exists using email
    try {
        const user = yield mongo_1.default.findOne({ email: req.body.email });
        if (!user) {
            return res.status(400).json({ message: "Invalid login details" });
        }
        // compare the user password with the password saved in DB
        const passwordMatch = yield bcryptjs_1.default.compare(req.body.password, user.password);
        if (!passwordMatch) {
            return res.status(400).json({ message: "Invalid login details" });
        }
        // generate auth token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
        // store token in a cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400,
        });
        return res.status(200).json({ message: " Login was successful" });
    }
    catch (error) {
        console.log(error);
        res.status(500).send("Something Went wrong");
    }
}));
// Validate Token
authRouter.get("/validate-token", auth_1.default, (req, res) => {
    res.status(200).send({ userId: req.userId });
});
// Logout User
authRouter.post("/logout", (req, res) => {
    res.cookie("auth_token", "", {
        expires: new Date(0)
    });
    res.send().status(200);
});
exports.default = authRouter;
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
