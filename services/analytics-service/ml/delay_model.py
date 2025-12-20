from typing import Optional, List

def predict_delay_from_features(features: dict) -> float:
    """
    Predict delay (seconds) using a lightweight statistical model.
    Uses real GTFS-derived features: avg delay, stddev, event count, time of day.
    """

    if not features or features["avg_delay"] is None:
        # Fallback: 30-second delay if no data is available
        return 30.0

    avg = features["avg_delay"] or 0
    std = features["delay_std"] or 0
    count = features["event_count"] or 0
    hour = int(features["hour_of_day"])

def predict_delay_seconds(recent_delays_rows) -> float:
    """
    Given recent rows of {arrival_delay}, predict a simple delay.
    """
    delays = [row["arrival_delay"] for row in recent_delays_rows if row["arrival_delay"] is not None]
    avg = compute_average_delay(delays)
    if avg is None:
        return 60.0  # default 1 min delay if no history
    return float(round(avg, 2))
