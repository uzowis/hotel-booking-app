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
const auth_1 = __importDefault(require("../middleware/auth"));
const hotels_1 = __importDefault(require("../models/hotels"));
const express_validator_1 = require("express-validator");
const stripe_1 = __importDefault(require("stripe"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const stripe = new stripe_1.default(process.env.STRIPE_API_KEY);
const hotelRoute = express_1.default.Router();
hotelRoute.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hotels = yield hotels_1.default.find({});
    if (!hotels)
        return res.status(404).json({ message: "No Hotels found!" });
    return res.status(200).json(hotels);
}));
hotelRoute.get("/search", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // create the constructSearchQuery function
    try {
        // declare the query property and assign the constructSearchQuery to it
        const query = constructSearchQuery(req.query);
        // create sortOptions object
        let sortOptions = {};
        switch (req.query.sortOptions) {
            case "starRating":
                sortOptions = { starRating: -1 };
                break;
            case "pricePerNightAsc":
                sortOptions = { pricePerNight: 1 };
                break;
            case "pricePerNightDesc":
                sortOptions = { pricePerNight: -1 };
                break;
            default:
                sortOptions = { starRating: -1 };
                break;
        }
        // define the pagination properties
        const pageSize = 5;
        const pageNumer = parseInt(req.query.page ? req.query.page.toString() : "1");
        const skip = (pageNumer - 1) * pageSize;
        // Find hotel using the constructed queries
        const hotels = yield hotels_1.default.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(pageSize);
        // get total number of documents in the hotels collection
        const total = yield hotels_1.default.countDocuments(query);
        // use the hotelSearchResponse to prepare the query response .
        const response = {
            data: hotels,
            pagination: {
                total: total,
                page: pageNumer,
                pages: Math.ceil(total / pageSize),
            },
        };
        // return the response
        res.status(200).json(response);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Could not fetch Hotels!" });
    }
}));
function constructSearchQuery(queryParams) {
    let constructedQuery = {};
    if (queryParams.destination) {
        constructedQuery.$or = [
            { city: new RegExp(queryParams.destination, "i") },
            { country: new RegExp(queryParams.destination, "i") },
        ];
    }
    if (queryParams.adultCount) {
        constructedQuery.adultCount = {
            $gte: parseInt(queryParams.adultCount),
        };
    }
    if (queryParams.childCount) {
        constructedQuery.childCount = {
            $gte: parseInt(queryParams.childCount),
        };
    }
    if (queryParams.facilities) {
        constructedQuery.facilities = {
            $all: Array.isArray(queryParams.facilities)
                ? queryParams.facilities
                : [queryParams.facilities],
        };
    }
    if (queryParams.types) {
        constructedQuery.type = {
            $in: Array.isArray(queryParams.types)
                ? queryParams.types
                : [queryParams.types],
        };
    }
    if (queryParams.stars) {
        const starRatings = Array.isArray(queryParams.stars)
            ? queryParams.stars.map((star) => parseInt(star))
            : parseInt(queryParams.stars);
        constructedQuery.starRating = {
            $in: starRatings,
        };
    }
    if (queryParams.maxPrice) {
        constructedQuery.pricePerNight = {
            $lte: parseInt(queryParams.maxPrice).toString(),
        };
    }
    return constructedQuery;
}
hotelRoute.get("/:hotelId", [(0, express_validator_1.param)("hotelId").notEmpty().withMessage("Enter a valid hotelId")], (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const error = (0, express_validator_1.validationResult)(req);
    if (!error.isEmpty())
        return res.status(400).json({ message: error.array() });
    try {
        const hotel = yield hotels_1.default.findOne({ _id: req.params.hotelId });
        res.status(200).json(hotel);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Error fetching hotel" });
    }
}));
hotelRoute.post("/:hotelId/bookings/payment-intent", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // extract numberOfNights booked from req body
    const { numberOfNights } = req.body;
    const hotelId = req.params.hotelId;
    // check if hotel to be booked exists
    const hotel = yield hotels_1.default.findOne({ _id: hotelId });
    if (!hotel)
        return res.status(404).json({ message: "Hotel not found!" });
    const totalCost = numberOfNights * hotel.pricePerNight;
    const paymentIntent = yield stripe.paymentIntents.create({
        amount: totalCost * 100,
        currency: "gbp",
        metadata: {
            hotelId: hotelId,
            userId: req.userId,
        },
    });
    if (!paymentIntent.client_secret)
        return res
            .status(500)
            .json({ message: "Error fetching paymentIntent" });
    const response = {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        totalCost,
    };
    console.log(response);
    res.json(response);
}));
hotelRoute.post("/:hotelId/bookings", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // retreive and confirm the paymentIntentId is valid
        const paymentIntent = yield stripe.paymentIntents.retrieve(req.body.paymentIntentId);
        if (!paymentIntent)
            return res
                .status(400)
                .json({ message: "Payment Intent not found" });
        // check if the paymentIntentId is meant for the user/hotel
        if (paymentIntent.metadata.hotelId !== req.params.hotelId ||
            paymentIntent.metadata.userId !== req.userId)
            return res
                .status(400)
                .json({ message: "payment intent mismatch" });
        // check if the paymentIntent status is succeeded
        if (paymentIntent.status !== "succeeded")
            return res.status(400).json({
                message: "Payment intent not succeeded. Status: " +
                    paymentIntent.status,
            });
        // prepare the new booking data
        const newBooking = Object.assign(Object.assign({}, req.body), { userId: req.userId });
        // find the hotel and update with the booking with the new booking data
        const hotel = yield hotels_1.default.findOneAndUpdate({ _id: req.params.hotelId }, { $push: { bookings: newBooking } });
        if (!hotel)
            return res.status(400).json({ message: "Hotel not found" });
        // send back response
        yield hotel.save();
        return res.status(201).send();
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong!" });
    }
}));
exports.default = hotelRoute;
