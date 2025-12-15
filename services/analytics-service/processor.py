from db_writer import insert_trip_update, fetch_realtime_features
from cache import cache_route_stop_metrics
from ml.metrics import compute_lateness_rating, compute_busyness_rating

# Add a global counter
MESSAGE_COUNT = 0

def process_message(msg: dict) -> None:
    global MESSAGE_COUNT

    msg_type = msg.get("type")
    if msg_type != "trip_update":
        return

    # 1. Store raw trip update
    insert_trip_update(msg)

    route_id = msg.get("route_id")
    stop_id = msg.get("stop_id")
    delay = msg.get("arrival_delay")

    if not route_id or not stop_id:
        return

    # 2. Compute Lateness
    lateness_label, lateness_score = compute_lateness_rating(delay)

    # 3. Get recent stop statistics
    features = fetch_realtime_features(route_id, stop_id)

    busyness_label, busyness_score = compute_busyness_rating(
        features["event_count"] or 0,
        features["avg_delay"] or 0,
        features["hour_of_day"]
    )

    metrics = {
        "route_id": route_id,
        "stop_id": stop_id,
        "lateness_label": lateness_label,
        "lateness_score": lateness_score,
        "busyness_label": busyness_label,
        "busyness_score": busyness_score,
        "timestamp": msg.get("timestamp_utc"),
    }

    # 4. Store in Redis
    cache_route_stop_metrics(route_id, stop_id, metrics)

    # Increment counter
    MESSAGE_COUNT += 1

    # Print only every 500 messages
    if MESSAGE_COUNT % 500 == 0:
        print(f"[Analytics] Processed {MESSAGE_COUNT} trip updates...")
