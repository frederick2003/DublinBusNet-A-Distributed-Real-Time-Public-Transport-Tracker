import { db } from "../db";

export function incrementRouteUsage(userId: string, routeId: string) {
  try {
    db.prepare(`
      INSERT INTO route_usage (user_id, route_id, count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, route_id)
      DO UPDATE SET count = count + 1
    `).run(userId, routeId);
  } catch (err: any) {
    // Defensive: route usage should never crash the API
    if (err.code === "SQLITE_CONSTRAINT_FOREIGNKEY") {
      console.warn("[routeUsage] ignoring stale user_id", userId);
      return;
    }
    throw err;
  }
}

/**
 * Returns the most frequently used route for a user
 */
export function getMostCommonRoute(userId: string): string | null {
  const row = db.prepare(`
    SELECT route_id
    FROM route_usage
    WHERE user_id = ?
    ORDER BY count DESC
    LIMIT 1
  `).get(userId) as { route_id: string } | undefined;

  return row?.route_id ?? null;
}
