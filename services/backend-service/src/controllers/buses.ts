import { Request, Response } from "express";
import { getActiveBuses, BusRecord } from "../services/busCache";
import { resolveRouteIds } from "../services/routeMetadata";
import { AuthenticatedRequest } from "../middleware/auth";
import { incrementRouteUsage } from "../services/routeUsage";

// GET /buses/active
export const activeBusesHandler = async (_req: Request, res: Response) => {
  const buses = await getActiveBuses();
  if (!buses.length)
    return res.status(404).json({ success: false, error: "No active buses" });
  res.json({ success: true, data: buses });
};

// GET /buses/by-route?route_id=46A&direction_id=1
export const busesByRouteHandler = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  const { route_id, direction_id } = req.query;
  if (!route_id) {
    return res
      .status(400)
      .json({ success: false, error: "route_id is required" });
  }

  if (req.user) {
    incrementRouteUsage(req.user.userId, String(route_id));
  }

  const routeCandidates = resolveRouteIds(String(route_id));
  const buses = await getActiveBuses();
  const filtered = buses.filter((bus) => {
    const routeMatch = routeCandidates.some(
      (candidate) =>
        bus.route_id.toLowerCase() === String(candidate).toLowerCase()
    );
    const dirMatch =
      typeof direction_id === "undefined" ||
      Number(bus.direction_id) === Number(direction_id);
    return routeMatch && dirMatch;
  });

  if (!filtered.length) {
    return res.status(404).json({
      success: false,
      error: `No active buses found for route ${route_id}`,
    });
  }

  res.json({ success: true, data: filtered });
};