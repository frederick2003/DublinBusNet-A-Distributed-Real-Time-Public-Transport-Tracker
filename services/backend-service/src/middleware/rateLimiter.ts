import { Request, Response, NextFunction } from 'express';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from '../services/redisClient';

const rateLimiter = new (RateLimiterRedis as any)({
  storeClient: Redis,
  points: 10, // 10 requests
  duration: 1, // per 1 second by IP
  keyPrefix: 'rlflx'
});

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || req.connection.remoteAddress || 'unknown';
  try {
    await rateLimiter.consume(key);
    next();
  } catch (rejRes) {
    res.status(429).json({ error: 'Too many requests' });
  }
};
