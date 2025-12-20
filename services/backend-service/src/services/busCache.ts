import redis from "./redisClient";
import { getShapes, getTrips } from "./shapes";
import { getRouteShortName } from "./routeMetadata";

export type BusRecord = {
  vehicle_id: string;
  route_id: string;
  direction_id: number;
  latitude: number;
  longitude: number;
  last_update: string;
  delay_seconds?: number;
};

export type LiveBus = {
  vehicle_id: string;
  lat: number;
  lon: number;
  route_id: string;
  direction_id: number;
  bearing?: number | null;
  speed?: number | null;
  timestamp: string;
};


const ACTIVE_KEY = "bus:active";
const DEFAULT_TTL = 90; // seconds
const MAX_GTFS_SEED_BUSES = 150;
let cachedGtfsSeed: BusRecord[] | null = null;

// Seed data to keep the API usable until ingestion fills Redis.
const seedData: BusRecord[] = [
  {
    vehicle_id: "VEH1234",
    route_id: "46A",
    direction_id: 1,
    latitude: 53.3498,
    longitude: -6.2603,
    last_update: "2025-11-08T09:05:00Z",
    delay_seconds: 120,
  },
  {
    vehicle_id: "VEH5678",
    route_id: "46A",
    direction_id: 1,
    latitude: 53.3452,
    longitude: -6.2711,
    last_update: "2025-11-08T09:07:00Z",
    delay_seconds: 60,
  },
  {
    vehicle_id: "VEH9012",
    route_id: "145",
    direction_id: 0,
    latitude: 53.3031,
    longitude: -6.2782,
    last_update: "2025-11-08T09:10:00Z",
    delay_seconds: -30,
  },
  {
    vehicle_id: "VEH155A",
    route_id: "155",
    direction_id: 1,
    latitude: 53.355,
    longitude: -6.25,
    last_update: "2025-11-08T09:12:00Z",
    delay_seconds: 45,
  },
  {
    vehicle_id: "VEH155B",
    route_id: "155",
    direction_id: 0,
    latitude: 53.345,
    longitude: -6.29,
    last_update: "2025-11-08T09:14:00Z",
    delay_seconds: -15,
  },
];

function buildGtfsSeed(): BusRecord[] {
  const shapes = getShapes();
  const trips = getTrips();

  if (!trips.length || !shapes.size) return [];

  const seen = new Set<string>();
  const seed: BusRecord[] = [];

  for (const trip of trips) {
    const key = `${trip.route_id}|${trip.direction_id ?? "x"}`;
    if (seen.has(key)) continue;

    const pts = shapes.get(trip.shape_id);
    if (!pts || !pts.length) continue;

    const midpoint = pts[Math.floor(pts.length / 2)];
    const short = getRouteShortName(trip.route_id) || trip.route_id;

    seed.push({
      vehicle_id: `GTFS-${short}-${trip.direction_id ?? 0}-${seed.length + 1}`,
      route_id: trip.route_id, // raw GTFS id so shapes + trips align
      direction_id: trip.direction_id ?? 0,
      latitude: midpoint.lat,
      longitude: midpoint.lon,
      last_update: new Date().toISOString(),
      delay_seconds: 0,
    });

    seen.add(key);
    if (seed.length >= MAX_GTFS_SEED_BUSES) break;
  }

  console.log(`[busCache] generated ${seed.length} GTFS-derived seed buses`);
  return seed;
}

async function getSeedBuses(): Promise<BusRecord[]> {
  if (!cachedGtfsSeed) {
    try {
      const generated = buildGtfsSeed();
      if (generated.length) cachedGtfsSeed = generated;
    } catch (err) {
      console.warn(
        "[busCache] failed to build GTFS seed",
        (err as any)?.message ?? err
      );
      cachedGtfsSeed = null;
    }
  }

  return cachedGtfsSeed && cachedGtfsSeed.length ? cachedGtfsSeed : seedData;
}

export async function setActiveBuses(
  buses: BusRecord[],
  ttlSeconds = DEFAULT_TTL
) {
  const payload = JSON.stringify({
    buses,
    updated_at: new Date().toISOString(),
  });
  await redis.set(ACTIVE_KEY, payload, "EX", ttlSeconds);
}

export async function getActiveBuses(): Promise<LiveBus[]> {
  const vehicleIds = await redis.smembers("active_vehicles");
  const buses: LiveBus[] = [];

  for (const id of vehicleIds) {
    const data = await redis.hgetall(`vehicle:${id}`);
    if (!data.lat || !data.lon) continue;

    buses.push({
      vehicle_id: id,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      route_id: data.route_id,
      direction_id: Number(data.direction_id),
      bearing: data.bearing ? Number(data.bearing) : null,
      speed: data.speed ? Number(data.speed) : null,
      timestamp: data.timestamp,
    });
  }

  return buses;
}


function isLegacySeed(_buses: any[]): boolean {
  return false;
}

export async function ensureSeeded() {
  const vehicleIds = await redis.smembers("active_vehicles");

  // If live ingestion has populated Redis, do nothing
  if (vehicleIds.length > 10) return;

  // Otherwise seed legacy data
  const seed = await getSeedBuses();
  await setActiveBuses(seed);
}

