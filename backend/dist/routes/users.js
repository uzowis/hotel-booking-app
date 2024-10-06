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
const express_validator_1 = require("express-validator");
const users_1 = __importDefault(require("../models/users"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_1 = __importDefault(require("../middleware/auth"));
const usersRoute = express_1.default.Router();
usersRoute.get("/me", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract the user id from the req object
    const userId = req.userId;
    try {
        // fetch user from db using userId
        const user = yield users_1.default.findOne({ _id: userId }, "-password");
        return res.status(200).json(user);
    }
    catch (error) {
        console.log(error);
        res.status(401).send("Unauthorized");
    }
}));
// Get all registered Users
usersRoute.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield users_1.default.find({}, "-password");
        res.status(200).json(user);
    }
    catch (error) {
        console.log(error);
        return res.status(400).json({
            message: "Something went wrong!",
        });
    }
}));
// Register new User
usersRoute.post("/register", [
    // Validate User input
    (0, express_validator_1.check)("firstName", "First name is required").isString(),
    (0, express_validator_1.check)("lastName", "Lastname is required").isString(),
    (0, express_validator_1.check)("email", "Email is requred").isEmail(),
    (0, express_validator_1.check)("password")
        .isLength({
        min: 6,
    })
        .withMessage("Password must be 6 characters or more")
        .isString()
        .withMessage("Password is required"),
], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if validation return errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array() });
    }
    try {
        // check if user already exists
        const email = yield users_1.default.findOne({ email: req.body.email });
        if (email) {
            return res.status(400).json({ message: "User already exists" });
        }
        // Instantiate a User and save new user
        const user = new users_1.default(req.body);
        yield user.save();
        //Generate user token
        const token = jsonwebtoken_1.default.sign({ user_id: user.id }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
        // Store the token in the cookie
        res.cookie("auth_token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 86400,
        });
        return res.status(200).json(user.id);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Something went wrong" });
    }
}));
exports.default = usersRoute;
