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

    # Congestion factor from event volume
    congestion_factor = min(count / 10, 5)

    # Peak hour multiplier
    if 7 <= hour <= 9 or 16 <= hour <= 18:
        peak_multiplier = 15  # 15 seconds added during peak
    else:
        peak_multiplier = 0

    predicted = avg + (0.3 * std) + peak_multiplier + congestion_factor

    # never negative
    return max(0.0, round(predicted, 2))
