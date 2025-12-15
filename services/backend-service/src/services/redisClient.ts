import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://redis:6379";

const redis = new Redis(redisUrl, {
  retryStrategy(times) {
    // retry with backoff, max 2 seconds
    return Math.min(times * 200, 2000);
  },
});

redis.on("connect", () => {
  console.log("[redis] connected");
});

redis.on("error", (err) => {
  console.warn("[redis] connection error:", err.message);
});

export default redis;
