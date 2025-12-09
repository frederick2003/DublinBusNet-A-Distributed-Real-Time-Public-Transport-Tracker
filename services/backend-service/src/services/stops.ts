import fs from 'fs';
import path from 'path';

export type StopRecord = {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
};

let cachedStops: StopRecord[] | null = null;

function resolveStopsPath(): string {
  // 1) Prefer explicit env
  if (process.env.STOPS_FILE && fs.existsSync(process.env.STOPS_FILE)) {
    return process.env.STOPS_FILE;
  }
  // 2) Mounted /app/data/stops.txt (set in docker-compose)
  const mounted = path.join(process.cwd(), 'data', 'stops.txt');
  if (fs.existsSync(mounted)) return mounted;
  // 3) Frontend public data (host dev path)
  const frontendPath = path.join(
    process.cwd(),
    '..',
    'frontend',
    'DublinBusNet',
    'public',
    'data',
    'stops.txt'
  );
  if (fs.existsSync(frontendPath)) return frontendPath;

  throw new Error('stops.txt not found. Set STOPS_FILE or mount /app/data/stops.txt');
}

function parseCsvLine(line: string): string[] {
  // Split CSV respecting quoted values
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  const matches = line.match(regex);
  return matches ? matches.map((v) => v.replace(/(^"|"$)/g, '')) : [];
}

export function loadStops(): StopRecord[] {
  if (cachedStops) return cachedStops;

  let raw: string;
  try {
    const resolvedPath = resolveStopsPath();
    raw = fs.readFileSync(resolvedPath, 'utf-8');
    console.log('[stops] using file', resolvedPath);
  } catch (err) {
    console.error('[stops] failed to read stops.txt', err);
    cachedStops = [];
    return cachedStops;
  }

  const lines = raw.trim().split('\n');
  const headers = parseCsvLine(lines[0]);

  const stops: StopRecord[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i] ?? ''));
    const lat = Number(obj['stop_lat']);
    const lon = Number(obj['stop_lon']);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    stops.push({
      stop_id: obj['stop_id'],
      stop_name: obj['stop_name'],
      stop_lat: lat,
      stop_lon: lon
    });
  }

  cachedStops = stops;
  console.log(`[stops] loaded ${stops.length} stops`);
  return cachedStops;
}

export function findNearestStop(lat: number, lon: number): StopRecord | null {
  const stops = loadStops();
  if (!stops.length) return null;

  let best: StopRecord | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const stop of stops) {
    const d = haversine(lat, lon, stop.stop_lat, stop.stop_lon);
    if (d < bestDist) {
      bestDist = d;
      best = stop;
    }
  }

  return best;
}

// Haversine distance in meters
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
