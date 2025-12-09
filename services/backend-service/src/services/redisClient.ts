import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redis = new Redis(redisUrl);

redis.on('connect', () => {
  console.log('[redis] connected');
});
redis.on('error', (err) => {
  console.error('[redis] error', err);
});

export default redis;
