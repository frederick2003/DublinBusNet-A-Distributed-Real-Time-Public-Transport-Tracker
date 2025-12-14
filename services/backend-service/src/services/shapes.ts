import fs from 'fs';
import path from 'path';
import { resolveDataPath } from './pathResolver';

type ShapePoint = {
  shape_id: string;
  lat: number;
  lon: number;
  seq: number;
};

type TripRow = {
  trip_id: string;
  route_id: string;
  direction_id: number | null;
  shape_id: string;
};

let cachedShapes: Map<string, ShapePoint[]> | null = null;
let cachedTrips: TripRow[] | null = null;

function parseCsv(line: string): string[] {
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  const matches = line.match(regex);
  return matches ? matches.map((v) => v.replace(/(^"|"$)/g, '')) : [];
}

function resolvePath(envKey: string, filename: string): string | null {
  return resolveDataPath(filename, envKey);
}

function loadShapes(): Map<string, ShapePoint[]> {
  if (cachedShapes) return cachedShapes;
  const shapePath = resolvePath('SHAPES_FILE', 'shapes.txt');
  const map = new Map<string, ShapePoint[]>();
  if (!shapePath) {
    console.warn('[shapes] shapes.txt not found (set SHAPES_FILE or mount /app/data/shapes.txt)');
    cachedShapes = map;
    return map;
  }
  const raw = fs.readFileSync(shapePath, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = parseCsv(lines[0]).map((h) => h.trim());
  for (const line of lines.slice(1)) {
    const cols = parseCsv(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i]?.trim() ?? ''));
    const shape_id = obj['shape_id']?.trim();
    const lat = Number(obj['shape_pt_lat']);
    const lon = Number(obj['shape_pt_lon']);
    const seq = Number(obj['shape_pt_sequence']);
    if (!shape_id || Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(seq)) continue;
    if (!map.has(shape_id)) map.set(shape_id, []);
    map.get(shape_id)?.push({ shape_id, lat, lon, seq });
  }
  // sort by sequence
  for (const pts of map.values()) {
    pts.sort((a, b) => a.seq - b.seq);
  }
  console.log(`[shapes] loaded ${map.size} shapes from ${shapePath}`);
  cachedShapes = map;
  return map;
}

function loadTrips(): TripRow[] {
  if (cachedTrips) return cachedTrips;
  const tripsPath = resolvePath('TRIPS_FILE', 'trips.txt');
  const rows: TripRow[] = [];
  if (!tripsPath) {
    console.warn('[trips] trips.txt not found (set TRIPS_FILE or mount /app/data/trips.txt)');
    cachedTrips = rows;
    return rows;
  }
  const raw = fs.readFileSync(tripsPath, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = parseCsv(lines[0]).map((h) => h.trim());
  for (const line of lines.slice(1)) {
    const cols = parseCsv(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i]?.trim() ?? ''));
    rows.push({
      trip_id: obj['trip_id']?.trim(),
      route_id: obj['route_id']?.trim(),
      direction_id:
        obj['direction_id'] === undefined || obj['direction_id'] === ''
          ? null
          : Number(obj['direction_id']),
      shape_id: obj['shape_id']?.trim()
    });
  }
  console.log(`[trips] loaded ${rows.length} trips from ${tripsPath}`);
  cachedTrips = rows;
  return rows;
}

export function getShapeForRoute(routeId: string, direction?: number | null) {
  const shapes = loadShapes();
  const trips = loadTrips();

  let shapeId: string | undefined;
  if (trips.length) {
    const match = trips.find(
      (t) =>
        t.route_id?.toLowerCase() === routeId.toLowerCase() &&
        (direction === undefined || direction === null || t.direction_id === direction)
    );
    shapeId = match?.shape_id;
  } else {
    // Fallback: try shape_id equal to routeId
    if (shapes.has(routeId)) shapeId = routeId;
  }

  if (!shapeId) return null;
  const pts = shapes.get(shapeId);
  if (!pts || !pts.length) return null;

  const coordinates = pts.map((p) => [p.lon, p.lat]);
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: {
      shape_id: shapeId,
      route_id: routeId,
      direction_id: direction ?? null,
      source: 'gtfs-shapes'
    }
  };
}

// Expose raw caches for other services (e.g., generating seed buses)
export function getShapes(): Map<string, ShapePoint[]> {
  return loadShapes();
}

export function getTrips(): TripRow[] {
  return loadTrips();
}

export type { ShapePoint, TripRow };
