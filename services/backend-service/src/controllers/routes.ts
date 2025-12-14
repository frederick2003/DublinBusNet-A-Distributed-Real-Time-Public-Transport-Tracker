import { Request, Response } from 'express';
import { findNearestStop } from '../services/stops';
import { getShapeForRoute } from '../services/shapes';
import { resolveRouteIds, getRouteColor } from '../services/routeMetadata';
import { getOrderedStopsForRoute } from '../services/stopTimes';
import { loadStops } from '../services/stops';

// Build a simple LineString from current bus positions on the requested route/direction.
// This is an approximation until GTFS shapes are wired in.
export const routeShapeHandler = async (req: Request, res: Response) => {
  const { route_id, direction_id } = req.query;
  if (!route_id) {
    return res.status(400).json({ success: false, error: 'route_id is required' });
  }

  const routeCandidates = resolveRouteIds(String(route_id));
  if (!routeCandidates.length) {
    return res
      .status(404)
      .json({ success: false, error: `No matching route found for "${route_id}"` });
  }

  const dir = typeof direction_id === 'undefined' ? undefined : Number(direction_id);

  // 1) Try to use GTFS shapes if available
  let shapeRouteId: string | null = null;
  let gtfsShape = null;
  for (const candidate of routeCandidates) {
    const shape = getShapeForRoute(String(candidate), dir);
    if (shape) {
      gtfsShape = shape;
      shapeRouteId = String(candidate);
      break;
    }
  }

  if (gtfsShape) {
    const color = getRouteColor(shapeRouteId || String(route_id));
    return res.json({
      success: true,
      data: {
        route_id: shapeRouteId,
        direction_id: dir ?? null,
        shape: gtfsShape,
        color: color ? `#${color.replace(/^#/, '')}` : undefined
      }
    });
  }

  return res
    .status(404)
    .json({ success: false, error: 'No shape available. Provide GTFS shapes.txt + trips.txt for accurate route lines.' });
};

// GET /routes/stops?route_id=..&direction_id=..
export const routeStopsHandler = (req: Request, res: Response) => {
  const { route_id, direction_id } = req.query;
  if (!route_id) {
    return res.status(400).json({ success: false, error: 'route_id is required' });
  }
  const routeCandidates = resolveRouteIds(String(route_id));
  if (!routeCandidates.length) {
    return res
      .status(404)
      .json({ success: false, error: `No matching route found for "${route_id}"` });
  }
  const dir = typeof direction_id === 'undefined' ? undefined : Number(direction_id);

  let orderedStops = null;
  let routeUsed: string | null = null;
  for (const candidate of routeCandidates) {
    orderedStops = getOrderedStopsForRoute(String(candidate), dir);
    if (orderedStops && orderedStops.length) {
      routeUsed = String(candidate);
      break;
    }
  }

  if (!orderedStops || !orderedStops.length || !routeUsed) {
    return res.status(404).json({ success: false, error: 'No stop sequence found for this route' });
  }

  const stopsIndex = new Map(loadStops().map((s) => [s.stop_id, s]));
  const features = orderedStops
    .map((st) => {
      const stop = stopsIndex.get(st.stop_id);
      if (!stop) return null;
      return {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [stop.stop_lon, stop.stop_lat]
        },
        properties: {
          stop_id: stop.stop_id,
          stop_name: stop.stop_name,
          stop_sequence: st.stop_sequence
        }
      };
    })
    .filter(Boolean);

  res.json({
    success: true,
    data: {
      route_id: routeUsed,
      direction_id: dir ?? null,
      stops: {
        type: 'FeatureCollection',
        features
      }
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
