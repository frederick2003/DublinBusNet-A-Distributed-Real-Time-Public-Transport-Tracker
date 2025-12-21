import time
import json
import redis
from collections import deque
from kafka_consumer import create_consumer

WINDOW_SECONDS = 300  # 5 minutes

redis_client = redis.Redis(host="redis", port=6379, decode_responses=True)

# stop_id -> deque[(timestamp, delay)]
stop_windows = {}

"""
def process_trip_update(msg: dict):
    stop_id = msg.get("stop_id")
    delay = msg.get("arrival_delay", 0)
    ts = msg.get("timestamp_utc")

    if not stop_id or ts is None:
        return

    dq = stop_windows.setdefault(stop_id, deque())
    dq.append((ts, delay))

    # evict old entries
    while dq and ts - dq[0][0] > WINDOW_SECONDS:
        dq.popleft()

    arrivals = len(dq)
    if arrivals == 0:
        return

    avg_delay = sum(d for _, d in dq) / arrivals

    # simple scoring
    score = arrivals
    if avg_delay > 120:
        score += 1
    if avg_delay > 300:
        score += 2

    if score <= 2:
        rating = "green"
    elif score <= 5:
        rating = "orange"
    else:
        rating = "red"

    redis_client.set(
        f"stop:busyness:{stop_id}",
        json.dumps({
            "stop_id": stop_id,
            "rating": rating,
            "score": score,
            "arrivals_last_5m": arrivals,
            "avg_delay_seconds": int(avg_delay),
            "computed_at_utc": ts,
        }),
        ex=WINDOW_SECONDS,
    )

"""

def process_trip_update(msg: dict):
    stop_id = msg.get("stop_id")
    ts = msg.get("timestamp_utc")

    if not stop_id or ts is None:
        return

    delay = msg.get("arrival_delay")
    if delay is None:
        delay = 0

    redis_client.set(
        f"stop:busyness:{stop_id}",
        json.dumps({
            "stop_id": stop_id,
            "rating": "green",
            "arrival_delay": delay,
            "computed_at_utc": ts,
        }),
        ex=300,
    )

    print(f"[DEBUG] Wrote stop busyness for {stop_id}")


def run():
    consumer = create_consumer()
    print("[Analytics] Stop busyness consumer running")

    for message in consumer:
        process_trip_update(message.value)

if __name__ == "__main__":
    run()
