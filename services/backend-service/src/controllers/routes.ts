import { Request, Response } from 'express';
import { getActiveBuses } from '../services/busCache';
import { findNearestStop } from '../services/stops';
import { getShapeForRoute } from '../services/shapes';

// Build a simple LineString from current bus positions on the requested route/direction.
// This is an approximation until GTFS shapes are wired in.
export const routeShapeHandler = async (req: Request, res: Response) => {
  const { route_id, direction_id } = req.query;
  if (!route_id) {
    return res.status(400).json({ success: false, error: 'route_id is required' });
  }

  const dir = typeof direction_id === 'undefined' ? undefined : Number(direction_id);

  // 1) Try to use GTFS shapes if available
  const gtfsShape = getShapeForRoute(String(route_id), dir);
  if (gtfsShape) {
    return res.json({
      success: true,
      data: {
        route_id,
        direction_id: dir ?? null,
        shape: gtfsShape
      }
    });
  }

  // 2) Fallback to live bus positions if shapes are missing
  const buses = (await getActiveBuses()).filter((b) => {
    const routeMatch = b.route_id.toLowerCase() === String(route_id).toLowerCase();
    const dirMatch = typeof dir === 'undefined' || Number(b.direction_id) === dir;
    return routeMatch && dirMatch;
  });

  if (buses.length < 3) {
    return res
      .status(404)
      .json({ success: false, error: 'No shape available. Provide GTFS shapes.txt + trips.txt for accurate route lines.' });
  }

  // Sort deterministically to make a reasonable line from live points
  const sorted = buses.slice().sort((a, b) => a.vehicle_id.localeCompare(b.vehicle_id));
  const coordinates = sorted.map((b) => [b.longitude, b.latitude]);

  const shape = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: {
      route_id,
      direction_id: dir ?? null,
      source: 'live-buses'
    }
  };

  res.json({
    success: true,
    data: {
      route_id,
      direction_id: dir ?? null,
      shape
    }
  });
};

// Simple origin→destination helper (kept for completeness)
export const routePathHandler = (req: Request, res: Response) => {
  const { origin, destination } = req.query;
  if (!origin || !destination) {
    return res
      .status(400)
      .json({ success: false, error: 'origin and destination query params are required' });
  }

  const [origLon, origLat] = String(origin)
    .split(',')
    .map((v) => Number(v.trim()));
  const [destLon, destLat] = String(destination)
    .split(',')
    .map((v) => Number(v.trim()));

  if ([origLon, origLat, destLon, destLat].some((v) => Number.isNaN(v))) {
    return res.status(400).json({ success: false, error: 'invalid coordinate format' });
  }

  const path = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [origLon, origLat],
        [(origLon + destLon) / 2, (origLat + destLat) / 2 + 0.0015],
        [destLon, destLat]
      ]
    },
    properties: {}
  };

  res.json({
    success: true,
    data: {
      origin: [origLon, origLat],
      destination: [destLon, destLat],
      path
    }
  });
};

// GET /routes/closest-stop?latitude=..&longitude=..
export const closestStopHandler = (req: Request, res: Response) => {
  const { latitude, longitude } = req.query;
  const lat = Number(latitude);
  const lon = Number(longitude);
  if ([latitude, longitude].some((v) => typeof v === 'undefined') || Number.isNaN(lat) || Number.isNaN(lon)) {
    return res
      .status(400)
      .json({ success: false, error: 'latitude and longitude query params are required' });
  }

  const stop = findNearestStop(lat, lon);
  if (!stop) return res.status(404).json({ success: false, error: 'No nearby stop found' });

  res.json({
    success: true,
    data: {
      stop_id: stop.stop_id,
      stop_name: stop.stop_name,
      latitude: stop.stop_lat,
      longitude: stop.stop_lon
    }
  });
};
