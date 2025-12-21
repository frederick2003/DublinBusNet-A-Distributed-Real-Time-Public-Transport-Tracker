import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface OptionalAuthRequest extends Request {
  user?: {
    userId: string;
  };
}

export function optionalAuth(
  req: OptionalAuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next();
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.user = { userId: payload.userId };
  } catch {
    // invalid token → treat as guest
  }

  next();
}
