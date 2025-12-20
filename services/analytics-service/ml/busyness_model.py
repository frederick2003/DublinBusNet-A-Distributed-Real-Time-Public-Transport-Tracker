def predict_busyness_from_features(features: dict) -> float:
    """
    Estimate busyness (0-10 scale) based on event frequency, delays,
    and time-of-day indicators.
    """

    if not features:
        return 2.0  # default low busyness

    count = features["event_count"] or 0
    avg_delay = features["avg_delay"] or 0
    hour = int(features["hour_of_day"])

    # Demand proxy: more updates = more buses = more passengers
    demand_score = min(count / 5, 10)

    # Congestion proxy: delays often correlate with busyness
    delay_score = min(avg_delay / 60, 10)  # 60s delay = medium busyness

    # Peak hour multiplier
    peak_score = 2 if (7 <= hour <= 9 or 16 <= hour <= 18) else 0

    busyness = (0.6 * demand_score) + (0.3 * delay_score) + (0.1 * peak_score)

    return round(min(busyness, 10), 2)
