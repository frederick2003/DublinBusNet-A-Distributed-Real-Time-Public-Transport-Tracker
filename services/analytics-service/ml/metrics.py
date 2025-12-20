def compute_lateness_rating(delay_sec: float):
    if delay_sec is None:
        return ("UNKNOWN", 0)

    if delay_sec > 300:
        return ("VERY_LATE", 10)
    elif delay_sec > 120:
        return ("LATE", 7)
    elif delay_sec > 30:
        return ("SLIGHTLY_LATE", 4)
    elif delay_sec > -30:
        return ("ON_TIME", 2)
    elif delay_sec > -120:
        return ("EARLY", 1)
    else:
        return ("VERY_EARLY", 0)


def compute_busyness_rating(event_count: int, avg_delay: float, hour: int):
    # Base demand score
    demand_score = min(event_count / 5, 10)

    # Congestion component
    delay_score = min((avg_delay or 0) / 60, 10)

    # Peak-time boost
    peak = 2 if (7 <= hour <= 9 or 16 <= hour <= 18) else 0

    score = 0.6 * demand_score + 0.3 * delay_score + 0.1 * peak

    if score < 2:
        label = "VERY_QUIET"
    elif score < 4:
        label = "QUIET"
    elif score < 6:
        label = "MODERATE"
    elif score < 8:
        label = "BUSY"
    else:
        label = "VERY_BUSY"

    return (label, round(score, 2))
