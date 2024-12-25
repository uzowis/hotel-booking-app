import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotels";
import { HotelType } from "../shared/types";

const router = express.Router();

router.get("/", verifyToken, async (req: Request, res: Response) => {
  try {
    // find all hotels where userId in bookings is equals current user
    const hotels = await Hotel.find({
      bookings: { $elemMatch: { userId: req.userId } },
    });

    //
    const results = hotels.map((hotel) => {
      const userBookings = hotel.bookings.filter(
        (booking) => booking.userId === req.userId
      );

      const hotelWithUserBookings: HotelType = {
        ...hotel.toObject(),
        bookings: userBookings,
      };

      return hotelWithUserBookings;
    });
    console.log(results);
    res.status(200).json(results);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
});

export default router;
