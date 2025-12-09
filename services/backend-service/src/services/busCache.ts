import redis from './redisClient';

export type BusRecord = {
  vehicle_id: string;
  route_id: string;
  direction_id: number;
  latitude: number;
  longitude: number;
  last_update: string;
  delay_seconds?: number;
};

const ACTIVE_KEY = 'bus:active';
const DEFAULT_TTL = 90; // seconds

// Seed data to keep the API usable until ingestion fills Redis.
const seedData: BusRecord[] = [
  {
    vehicle_id: 'VEH1234',
    route_id: '46A',
    direction_id: 1,
    latitude: 53.3498,
    longitude: -6.2603,
    last_update: '2025-11-08T09:05:00Z',
    delay_seconds: 120
  },
  {
    vehicle_id: 'VEH5678',
    route_id: '46A',
    direction_id: 1,
    latitude: 53.3452,
    longitude: -6.2711,
    last_update: '2025-11-08T09:07:00Z',
    delay_seconds: 60
  },
  {
    vehicle_id: 'VEH9012',
    route_id: '145',
    direction_id: 0,
    latitude: 53.3031,
    longitude: -6.2782,
    last_update: '2025-11-08T09:10:00Z',
    delay_seconds: -30
  },
  {
    vehicle_id: 'VEH155A',
    route_id: '155',
    direction_id: 1,
    latitude: 53.355,
    longitude: -6.25,
    last_update: '2025-11-08T09:12:00Z',
    delay_seconds: 45
  },
  {
    vehicle_id: 'VEH155B',
    route_id: '155',
    direction_id: 0,
    latitude: 53.345,
    longitude: -6.29,
    last_update: '2025-11-08T09:14:00Z',
    delay_seconds: -15
  }
];

export async function setActiveBuses(buses: BusRecord[], ttlSeconds = DEFAULT_TTL) {
  const payload = JSON.stringify({ buses, updated_at: new Date().toISOString() });
  await redis.set(ACTIVE_KEY, payload, 'EX', ttlSeconds);
}

export async function getActiveBuses(): Promise<BusRecord[]> {
  try {
    const cached = await redis.get(ACTIVE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      return parsed?.buses ?? [];
    }
  } catch (err) {
    console.warn('[busCache] failed to read cache', (err as any)?.message ?? err);
  }
  // fallback to seed data if nothing cached yet
  return seedData;
}

// On startup, ensure there is something in cache so the API is never empty.
export async function ensureSeeded() {
  const existing = await getActiveBuses();
  if (!existing || existing.length === 0) {
    await setActiveBuses(seedData);
  }
}
