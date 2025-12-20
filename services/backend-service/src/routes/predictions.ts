import { Router, Request, Response } from "express";
import {
  fetchRecentTripDelays,
  predictDelaySeconds,
  mapCountToBusyness
} from "../services/predictions";

const router = Router();

/**
 * GET /predict/stop/busyness
 */
router.get("/predict/stop/busyness", async (req: Request, res: Response) => {
  const { route_id, stop_id } = req.query;

  if (typeof route_id !== "string" || typeof stop_id !== "string") {
    return res.status(400).json({
      success: false,
      error: "route_id and stop_id are required"
    });
  }

  try {
    const delays = await fetchRecentTripDelays(route_id, stop_id);
    const delayPred = predictDelaySeconds(delays);

    return res.json({
      success: true,
      data: {
        route_id,
        stop_id,
        predicted_delay_seconds: delayPred,
        busy_rating: mapCountToBusyness(delays.length),
        confidence: 0.75
      }
    });
  } catch (err) {
    console.error("[Predict stop busyness]", err);
    return res.status(500).json({ success: false });
  }
});

/**
 * GET /predict/bus/busyness
 */
router.get("/predict/bus/busyness", async (req: Request, res: Response) => {
  const { route_id, vehicle_id, stop_id } = req.query;

  if (typeof route_id !== "string" || typeof vehicle_id !== "string") {
    return res.status(400).json({
      success: false,
      error: "route_id and vehicle_id are required"
    });
  }

  try {
    let delays: number[] = [];

    if (typeof stop_id === "string") {
      delays = await fetchRecentTripDelays(route_id, stop_id);
    }

    return res.json({
      success: true,
      data: {
        vehicle_id,
        route_id,
        stop_id,
        predicted_delay_seconds: predictDelaySeconds(delays),
        busy_rating: mapCountToBusyness(delays.length),
        confidence: 0.7
      }
    });
  } catch (err) {
    console.error("[Predict bus busyness]", err);
    return res.status(500).json({ success: false });
  }
});

export default router;
