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
const hotels_1 = __importDefault(require("../models/hotels"));
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const auth_1 = __importDefault(require("../middleware/auth"));
const hotelRoute = express_1.default.Router();
// initiate the multer instance that would be used to handle file upload
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
});
hotelRoute.post("/", auth_1.default, [
    (0, express_validator_1.body)("name")
        .isString()
        .notEmpty()
        .withMessage("Hotel name is required"),
    (0, express_validator_1.body)("city").isString().notEmpty().withMessage("City is required"),
    (0, express_validator_1.body)("country")
        .isString()
        .notEmpty()
        .withMessage("Country is required"),
    (0, express_validator_1.body)("description")
        .isString()
        .notEmpty()
        .withMessage("Description is required"),
    (0, express_validator_1.body)("pricePerNight")
        .isNumeric()
        .withMessage("Price Per Night is required and must be a number"),
    (0, express_validator_1.body)("starRating")
        .isNumeric()
        .notEmpty()
        .withMessage("City is required"),
    (0, express_validator_1.body)("type").isString().notEmpty().withMessage("Type is required"),
    (0, express_validator_1.body)("facilities")
        .isArray()
        .isString()
        .notEmpty()
        .withMessage("Facilities is required"),
    (0, express_validator_1.body)("adultCount")
        .isNumeric()
        .notEmpty()
        .withMessage("Adult count is required"),
    (0, express_validator_1.body)("childCount")
        .isNumeric()
        .notEmpty()
        .withMessage("Child count is required"),
], upload.array("imageFiles", 6), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // check for validation errors
        const error = (0, express_validator_1.validationResult)(req);
        if (!error.isEmpty())
            return res.status(400).json({ message: error.array() });
        const imageFiles = req.files;
        const newHotel = req.body;
        const imageUrls = yield uploadImages(imageFiles);
        (newHotel.imageUrls = imageUrls), (newHotel.userId = req.userId);
        newHotel.lastUpdated = new Date();
        const hotel = new hotels_1.default(newHotel);
        yield hotel.save();
        res.status(200).send(hotel);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "something went wrong!" });
    }
    // Append imageUrls to the req.body object
    // Append the current date and time as lastUpdated to the req.body object
    // save the data to Hotel model.
    // return json response to user.
}));
// Upload images to Cloudinary
function uploadImages(imageFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        const uploadPromises = imageFiles.map((image) => __awaiter(this, void 0, void 0, function* () {
            const b64 = Buffer.from(image.buffer).toString("base64");
            let dataURI = `data:${image.mimetype};base64,${b64}`;
            const res = yield cloudinary_1.v2.uploader.upload(dataURI);
            return res.url;
        }));
        const imageUrls = yield Promise.all(uploadPromises);
        return imageUrls;
    });
}
;
exports.default = hotelRoute;
