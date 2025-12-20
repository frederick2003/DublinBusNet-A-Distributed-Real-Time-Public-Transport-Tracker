import { Router } from "express";
import { healthHandler } from "./controllers/health";
import { predictHandler } from "./controllers/predict";
import {
  activeBusesHandler,
  busesByRouteHandler,
} from "./controllers/buses";
import {
  routePathHandler,
  routeShapeHandler,
  closestStopHandler,
  routeStopsHandler,
} from "./controllers/routes";
import { optionalAuth } from "./middleware/optionalAuth";

import {
  userFavouriteRoutesHandler,
  userMostCommonRouteHandler,
  userLastRouteHandler,
  addFavouriteRouteHandler,
} from "./controllers/userRoutes";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";

const router = Router();

router.get("/health", healthHandler);
router.get("/hello", (_req, res) => {
  res.json({ message: "Hello from backend-service" });
});

router.get('/buses/by-route', optionalAuth, busesByRouteHandler);

// Predict endpoint: POST /predict
router.post("/predict", rateLimiterMiddleware, predictHandler);

// Bus endpoints consumed by the frontend map
router.get("/buses/active", activeBusesHandler);
router.get("/buses/by-route", busesByRouteHandler);

// Simple route geometry helpers for drawing lines on the map
router.get("/routes/shape", routeShapeHandler);
router.get("/routes/path", routePathHandler);
router.get("/routes/closest-stop", closestStopHandler);
router.get("/routes/stops", routeStopsHandler);

// Stubbed user route endpoints for the search bar UX
router.get("/users/:user_id/routes/favourite", userFavouriteRoutesHandler);
router.get("/users/:user_id/routes/common", userMostCommonRouteHandler);
router.get("/users/:user_id/routes/last", userLastRouteHandler);
router.post("/users/:user_id/routes/favourite", addFavouriteRouteHandler);

export default router;
