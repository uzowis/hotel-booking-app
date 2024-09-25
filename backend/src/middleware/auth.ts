import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId: string;
      cookies: [string];
    }
  }
}

async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // grab the token from req.cookie.
  const token = req.cookies["auth_token"];


  try {
    // use jwt.verify to verify the token
    const user = jwt.verify(token, process.env.JWT_SECRET_KEY as string);

    // assign the decoded userId to req.userId
    req.userId = (user as JwtPayload).userId;

    next();
  } catch (error) {
    console.log(error);
    res.status(401).json({ message: "Unauthorized" });
  }
}

export default verifyToken;
