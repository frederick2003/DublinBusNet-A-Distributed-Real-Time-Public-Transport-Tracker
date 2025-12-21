import redis from "./redisClient"

const MAX_WINDOW = 50;

export async function fetchRecentTripDelays(
  routeId: string,
  stopId: string,
  limit: number = MAX_WINDOW
): Promise<number[]> {
  const key = `delays:route:${routeId}:stop:${stopId}`;
  const values = await redis.lrange(key, 0, limit - 1);

  return values.map(v => parseInt(v, 10)).filter(v => !Number.isNaN(v));
}

export function predictDelaySeconds(delays: number[]): number {
  if (!delays || delays.length === 0) {
    return 60.0;
  }

  const avg = delays.reduce((sum, d) => sum + d, 0) / delays.length;
  return Math.round(avg * 100) / 100;
}

export function mapCountToBusyness(count: number): "low" | "medium" | "high" {
  if (count >= 30) return "high";
  if (count >= 10) return "medium";
  return "low";
}
