import os
import redis

# Redis client (one per process, reused)
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "redis"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True,
)

MAX_WINDOW = 50

# Simple counters for periodic logging
trip_counter = 0
vehicle_counter = 0

def fetch_recent_trip_delays(route_id: str, stop_id: str, limit: int = 50) -> list[int]:
    key = f"delays:route:{route_id}:stop:{stop_id}"
    values = redis_client.lrange(key, 0, limit - 1)
    return [int(v) for v in values]

def record_delay(route_id: str, stop_id: str, arrival_delay: int | None):
    if arrival_delay is None:
        return

    key = f"delays:route:{route_id}:stop:{stop_id}"

    pipe = redis_client.pipeline()
    pipe.lpush(key, arrival_delay)
    pipe.ltrim(key, 0, MAX_WINDOW - 1)
    pipe.execute()

def process_message(msg: dict) -> None:
    print("[DEBUG] Received Kafka message:", msg)
    global trip_counter, vehicle_counter

    msg_type = msg.get("type")

    if msg_type == "trip_update":
        trip_counter += 1

        # Extract fields we actually need
        route_id = msg.get("route_id")
        stop_id = msg.get("stop_id")
        arrival_delay = msg.get("arrival_delay")

        if route_id and stop_id:
            record_delay(route_id, stop_id, arrival_delay)

        if trip_counter % 500 == 0:
            print(f"[Analytics] Processed {trip_counter} trip updates")

    elif msg_type == "vehicle_position":
        vehicle_counter += 1

        if vehicle_counter % 200 == 0:
            print(f"[Analytics] Processed {vehicle_counter} vehicle positions")

    else:
        print(f"[Analytics] Unknown message type: {msg_type}")