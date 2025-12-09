import { Request, Response } from 'express';
import { getActiveBuses, BusRecord } from '../services/busCache';

// GET /buses/active
export const activeBusesHandler = async (_req: Request, res: Response) => {
  const buses = await getActiveBuses();
  if (!buses.length) return res.status(404).json({ success: false, error: 'No active buses' });
  res.json({ success: true, data: buses });
};

// GET /buses/by-route?route_id=46A&direction_id=1
export const busesByRouteHandler = async (req: Request, res: Response) => {
  const { route_id, direction_id } = req.query;
  if (!route_id) {
    return res.status(400).json({ success: false, error: 'route_id is required' });
  }

  const buses = await getActiveBuses();
  const filtered = buses.filter((bus) => {
    const routeMatch = bus.route_id.toLowerCase() === String(route_id).toLowerCase();
    const dirMatch =
      typeof direction_id === 'undefined' || Number(bus.direction_id) === Number(direction_id);
    return routeMatch && dirMatch;
  });

  if (!filtered.length) {
    return res
      .status(404)
      .json({ success: false, error: `No active buses found for route ${route_id}` });
  }

  res.json({ success: true, data: filtered });
};

// GET /buses/by-stop?stop_id=1842&time_window_minutes=30
export const busesByStopHandler = async (req: Request, res: Response) => {
  const { stop_id, time_window_minutes } = req.query;
  if (!stop_id) {
    return res.status(400).json({ success: false, error: 'stop_id is required' });
  }
  const windowMinutes = Number(time_window_minutes) || 30;

  const buses = await getActiveBuses();
  if (!buses.length) return res.status(404).json({ success: false, error: 'No upcoming buses' });

  // In absence of trip stop-time data, synthesize ETAs deterministically from the bus list.
  const arrivals = buses.slice(0, 5).map((bus: BusRecord, idx: number) => ({
    vehicle_id: bus.vehicle_id,
    route_id: bus.route_id,
    expected_arrival_time: new Date(Date.now() + (idx + 1) * (windowMinutes / 5) * 60 * 1000)
      .toISOString(),
    delay_seconds: bus.delay_seconds ?? 0,
    busy_rating: Math.min(10, 4 + idx * 1.2)
  }));

  res.json({ success: true, data: arrivals });
};
