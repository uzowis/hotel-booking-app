import { body, validationResult } from "express-validator";
import Hotel from "../models/hotels";
import express, { Response, Request } from "express";
import multer from "multer";
import { HotelType } from "../shared/types";
import { v2 } from "cloudinary";
import verifyToken from "../middleware/auth";

const hotelRoute = express.Router();

// initiate the multer instance that would be used to handle file upload
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

hotelRoute.post(
  "/",
  verifyToken,
  upload.array("imageFiles", 6),
  [
    body("name").notEmpty().withMessage("Hotel name is required"),
    body("city").notEmpty().withMessage("City is required"),
    body("country").notEmpty().withMessage("Country is required"),
    body("description").notEmpty().withMessage("Description is required"),
    body("pricePerNight")
      .notEmpty()
      .isNumeric()
      .withMessage("Price Per Night is required and must be a number"),
    body("starRating")
      .notEmpty()
      .isNumeric()
      .withMessage("Star Rating is required"),
    body("type").notEmpty().withMessage("Type is required"),
    body("facilities")
      .notEmpty()
      .isArray()
      .withMessage("Facilities is required"),
    body("adultCount")
      .notEmpty()
      .isNumeric()
      .withMessage("Adult count is required"),
    body("childCount")
      .notEmpty()
      .isNumeric()
      .withMessage("Child count is required"),
  ],
  async (req: Request, res: Response) => {
    try {
      console.log(req.body);
      console.log(JSON.stringify(req.body));
      //console.log(req.files);
      // check for validation errors
      const error = validationResult(req);
      if (!error.isEmpty()) {
        return res.status(400).json({ message: error.array() });
      }

      const imageFiles = req.files as Express.Multer.File[];
      const newHotel: HotelType = req.body;

      const imageUrls = await uploadImages(imageFiles);
      newHotel.imageUrls = imageUrls;
      newHotel.userId = req.userId;
      newHotel.lastUpdated = new Date();

      const hotel = new Hotel(newHotel);
      await hotel.save();

      res.status(200).send(hotel);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "something went wrong!" });
    }

    // Append imageUrls to the req.body object
    // Append the current date and time as lastUpdated to the req.body object
    // save the data to Hotel model.
    // return json response to user.
  }
);
// Upload images to Cloudinary
async function uploadImages(imageFiles: Express.Multer.File[]) {
  const uploadPromises = imageFiles.map(async (image) => {
    const b64 = Buffer.from(image.buffer).toString("base64");
    let dataURI = `data:${image.mimetype};base64,${b64}`;

    const res = await v2.uploader.upload(dataURI);
    return res.url;
  });

  
  const imageUrls = await Promise.all(uploadPromises);
  return imageUrls;
}

export default hotelRoute;
