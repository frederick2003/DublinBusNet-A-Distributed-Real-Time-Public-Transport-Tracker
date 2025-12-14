import fs from 'fs';
import { resolveDataPath } from './pathResolver';

export type RouteMeta = {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_color?: string;
};

let cachedRoutes: RouteMeta[] | null = null;
let cachedIndex:
  | {
      byId: Map<string, RouteMeta>;
      byShort: Map<string, RouteMeta[]>;
    }
  | null = null;

function parseCsv(line: string): string[] {
  const regex = /(".*?"|[^",]+)(?=\s*,|\s*$)/g;
  const matches = line.match(regex);
  return matches ? matches.map((v) => v.replace(/(^"|"$)/g, '')) : [];
}

function resolveRoutesPath(): string | null {
  return resolveDataPath('routes.txt', 'ROUTES_FILE');
}

export function loadRoutes(): RouteMeta[] {
  if (cachedRoutes) return cachedRoutes;
  const filePath = resolveRoutesPath();
  if (!filePath) {
    console.warn('[routes] routes.txt not found (set ROUTES_FILE or mount /app/data/routes.txt)');
    cachedRoutes = [];
    cachedIndex = { byId: new Map(), byShort: new Map() };
    return cachedRoutes;
  }

  const raw = fs.readFileSync(filePath, 'utf-8').trim();
  const lines = raw.split('\n');
  const headers = parseCsv(lines[0]).map((h) => h.trim());
  const routes: RouteMeta[] = [];

  for (const line of lines.slice(1)) {
    const cols = parseCsv(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = cols[i]?.trim() ?? ''));
    routes.push({
      route_id: obj['route_id'],
      route_short_name: obj['route_short_name'] || obj['route_long_name'] || obj['route_id'],
      route_long_name: obj['route_long_name'] || obj['route_short_name'] || obj['route_id'],
      route_color: obj['route_color'] || undefined
    });
  }

  cachedRoutes = routes;

  const byId = new Map<string, RouteMeta>();
  const byShort = new Map<string, RouteMeta[]>();
  routes.forEach((r) => {
    byId.set(r.route_id.toLowerCase(), r);
    const shortKey = (r.route_short_name || '').toLowerCase();
    if (!shortKey) return;
    if (!byShort.has(shortKey)) byShort.set(shortKey, []);
    byShort.get(shortKey)?.push(r);
  });
  cachedIndex = { byId, byShort };
  console.log(`[routes] loaded ${routes.length} routes from ${filePath}`);
  return routes;
}

export function resolveRouteIds(input: string): string[] {
  const needle = input.trim().toLowerCase();
  const index = getRouteIndex();
  const matches = new Set<string>();

  if (index.byId.has(needle)) {
    matches.add(index.byId.get(needle)!.route_id);
  }

  if (index.byShort.has(needle)) {
    index.byShort.get(needle)!.forEach((r) => matches.add(r.route_id));
  }

  // Fallback: allow direct passthrough of whatever the user sent
  if (!matches.size && input) {
    matches.add(input);
  }

  return Array.from(matches);
}

export function getRouteShortName(routeId: string): string | undefined {
  const index = getRouteIndex();
  const meta = index.byId.get(routeId.toLowerCase());
  return meta?.route_short_name;
}

export function getRouteColor(routeId: string): string | undefined {
  const index = getRouteIndex();
  const meta = index.byId.get(routeId.toLowerCase());
  return meta?.route_color;
}

export function getRouteIndex() {
  if (cachedIndex) return cachedIndex;
  loadRoutes();
  return cachedIndex!;
}
