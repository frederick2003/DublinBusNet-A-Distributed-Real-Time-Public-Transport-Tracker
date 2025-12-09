import { Request, Response } from 'express';
import redis from '../services/redisClient';
import axios from 'axios';
// Use require for axios-retry to avoid TS/ESM interop runtime issues
const axiosRetry = require('axios-retry');
const CircuitBreaker = require('opossum');

// Configure axios retries for transient errors
// Configure axios retries for transient errors (guard against missing helper)
const retryOptions: any = { retries: 3 };
if (axiosRetry && axiosRetry.exponentialDelay) retryOptions.retryDelay = axiosRetry.exponentialDelay;
axiosRetry(axios, retryOptions);

const ANALYTICS_URL = process.env.ANALYTICS_URL || 'http://analytics:4000/predict';

// Try to call analytics service as the primary prediction path. If that fails,
// fallback to a local simulation. Circuit breaker wraps the prediction operation.
async function doPrediction(input: any) {
  try {
    // Proxy request to analytics service (with axios retries)
    const resp = await axios.post(ANALYTICS_URL, input, { timeout: 4000 });
    if (resp && resp.data) return resp.data;
  } catch (err) {
    // Log and fall through to local simulation
    console.warn('[predict] analytics proxy failed, falling back to local simulate', (err as any)?.message ?? err);
  }

  // Local simulation fallback
  await new Promise((r) => setTimeout(r, 200));
  return { prediction: `predicted-${JSON.stringify(input)}`, ts: new Date().toISOString() };
}

const breakerOptions = {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000
};

const breaker = new CircuitBreaker(doPrediction, breakerOptions);

export const predictHandler = async (req: Request, res: Response) => {
  const input = req.body || {};
  const cacheKey = `predict:${JSON.stringify(input)}`;

  try {
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ fromCache: true, result: JSON.parse(cached) });
    }

    // Use circuit breaker to call prediction (which attempts analytics proxy then local fallback)
    const result = await breaker.fire(input);

    // Cache result for a short TTL
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', 30);
    } catch (e) {
      console.warn('[predict] failed to cache result', (e as any)?.message ?? e);
    }

    res.json({ fromCache: false, result });
  } catch (err) {
    // Fallback: return a basic response
    console.error('predict error', err);
    res.status(500).json({ error: 'prediction_failed', fallback: { prediction: null } });
  }
};
