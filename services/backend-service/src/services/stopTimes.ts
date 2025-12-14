import fs from 'fs';
import { resolveDataPath } from './pathResolver';
import { getTrips } from './shapes';

export type StopTime = {
  trip_id: string;
  arrival_time?: string;
  departure_time?: string;
  stop_id: string;
  stop_sequence: number;
};

let cachedStopTimes: StopTime[] | null = null;

function parseCsv(line: string): string[] {
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  const matches = line.match(regex);
  return matches ? matches.map((v) => v.replace(/(^"|"$)/g, '')) : [];
}

function resolveStopTimesPath(): string | null {
  return resolveDataPath('stop_times.txt', 'STOP_TIMES_FILE');
}

export function loadStopTimes(): StopTime[] {
  if (cachedStopTimes) return cachedStopTimes;
  const filePath = resolveStopTimesPath();
  if (!filePath) {
    console.warn('[stop_times] stop_times.txt not found (set STOP_TIMES_FILE or mount /app/data/stop_times.txt)');
    cachedStopTimes = [];
    return cachedStopTimes;
  }
  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = parseCsv(lines[0]).map((h) => h.trim());
  const rows: StopTime[] = [];
  for (const line of lines.slice(1)) {
    const cols = parseCsv(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i]?.trim() ?? ''));
    const seq = Number(obj['stop_sequence']);
    rows.push({
      trip_id: obj['trip_id'],
      arrival_time: obj['arrival_time'] || undefined,
      departure_time: obj['departure_time'] || undefined,
      stop_id: obj['stop_id'],
      stop_sequence: Number.isNaN(seq) ? 0 : seq
    });
  }
  cachedStopTimes = rows;
  console.log(`[stop_times] loaded ${rows.length} rows from ${filePath}`);
  return cachedStopTimes;
}

export function getOrderedStopsForRoute(routeId: string, direction?: number | null) {
  const trips = getTrips();
  const stopTimes = loadStopTimes();
  // pick a representative trip for the route/direction
  const trip = trips.find(
    (t) =>
      t.route_id?.toLowerCase() === routeId.toLowerCase() &&
      (direction === undefined || direction === null || t.direction_id === direction)
  );
  if (!trip) return null;

  const stops = stopTimes
    .filter((st) => st.trip_id === trip.trip_id)
    .sort((a, b) => a.stop_sequence - b.stop_sequence);
  return stops;
}
