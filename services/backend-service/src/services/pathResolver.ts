import fs from 'fs';
import path from 'path';

/**
 * Resolve a data file by checking several common locations:
 * 1. Explicit env var (if provided)
 * 2. Local ./data mount (used in Docker)
 * 3. Frontend public data (dev convenience)
 * 4. Repository-level Updated_Dublin_Bus_Static_Data folder
 */
export function resolveDataPath(filename: string, envKey?: string): string | null {
  if (envKey && process.env[envKey] && fs.existsSync(process.env[envKey] as string)) {
    return process.env[envKey] as string;
  }

  const candidates = [
    path.join(process.cwd(), 'data', filename),
    path.join(process.cwd(), '..', 'frontend', 'DublinBusNet', 'public', 'data', filename),
    path.join(path.resolve(process.cwd(), '..', '..'), 'Updated_Dublin_Bus_Static_Data', filename)
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return null;
}
