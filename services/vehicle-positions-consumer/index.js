import { Kafka } from "kafkajs";
import Redis from "ioredis";

const kafka = new Kafka({
  brokers: [process.env.KAFKA_BROKER || "redpanda:9092"],
});

const redis = new Redis({
  host: process.env.REDIS_HOST || "redis",
  port: 6379,
});

const consumer = kafka.consumer({
  groupId: "vehicle-positions-redis-writer",
});

async function run() {
  await consumer.connect();
  await consumer.subscribe({
    topic: "vehicle_positions",
    fromBeginning: false,
  });

  console.log("[Consumer] Listening for vehicle positions");

  let seen = 0;
  let parsed = 0;
  let wrote = 0;
  let skipped = 0;

  setInterval(() => {
    console.log(
      `[Stats] seen=${seen} parsed=${parsed} wrote=${wrote} skipped=${skipped}`
    );
  }, 5000);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let payload;
      try {
        payload = JSON.parse(message.value.toString());
      } catch {
        return;
      }

      // REQUIRED fields
      if (!payload.vehicle_id) return;
      if (payload.latitude == null || payload.longitude == null) return;

      const vehicleId = payload.vehicle_id;

      await redis.hset(`vehicle:${vehicleId}`, {
        lat: payload.latitude.toString(),
        lon: payload.longitude.toString(),
        route_id: payload.route_id ?? "",
        direction_id: payload.direction_id?.toString() ?? "",
        bearing: payload.bearing?.toString() ?? "",
        speed: payload.speed?.toString() ?? "",
        timestamp: payload.timestamp_utc ?? payload.feed_timestamp ?? "",
      });

      await redis.sadd("active_vehicles", vehicleId);

      console.log(`[Consumer] Updated vehicle ${vehicleId}`);
    },
  });
}

run().catch(console.error);
