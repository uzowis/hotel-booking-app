import express, { Request, Response } from "express";
import verifyToken from "../middleware/auth";
import Hotel from "../models/hotels";
import { HotelSearchResponse } from "../shared/types";

const hotelRoute = express.Router();

hotelRoute.get("/", verifyToken, async (req: Request, res: Response) => {
  const hotels = await Hotel.find({});
  if (!hotels)
    return res.status(404).json({ message: "No Hotels found!" });

  return res.status(200).json(hotels);
});


hotelRoute.get("/search", async (req: Request, res: Response) => {
  // create the constructSearchQuery function
  try {
    // declare the query property and assign the constructSearchQuery to it
    const query: any =  constructSearchQuery(req.query);

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
    const pageNumer = parseInt(
      req.query.page ? req.query.page.toString() : "1"
    );
    const skip = (pageNumer - 1) * pageSize;

    // Find hotel using the constructed queries
    const hotels = await Hotel.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(pageSize);

    // get total number of documents in the hotels collection
    const total = await Hotel.countDocuments(query);

    // use the hotelSearchResponse to prepare the query response .
    const response: HotelSearchResponse = {
      data: hotels,
      pagination: {
        total: total,
        page: pageNumer,
        pages: Math.ceil(total / pageSize),
      },
    };

    // return the response
    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Could not fetch Hotels!" });
  }
});

function constructSearchQuery(queryParams: any) {
  let constructedQuery: any = {};

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
      ? queryParams.stars.map((star: string) => parseInt(star))
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
};

hotelRoute.get("/:hotelId", async (req: Request, res: Response) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.hotelId });
    res.status(200).json(hotel);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching hotel" });
  }
});

hotelRoute.get(
  "/:hotelId/booking/payment-intent",
  verifyToken,
  async (req: Request, res: Response) => {}
);



export default hotelRoute;
