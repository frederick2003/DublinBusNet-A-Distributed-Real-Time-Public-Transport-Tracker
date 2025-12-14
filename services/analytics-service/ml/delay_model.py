from typing import Optional, List


def compute_average_delay(delays: List[int]) -> Optional[float]:
    if not delays:
        return None
    return sum(delays) / len(delays)


def predict_delay_seconds(recent_delays_rows) -> float:
    """
    Given recent rows of {arrival_delay}, predict a simple delay.
    """
    delays = [row["arrival_delay"] for row in recent_delays_rows if row["arrival_delay"] is not None]
    avg = compute_average_delay(delays)
    if avg is None:
        return 60.0  # default 1 min delay if no history
    return float(round(avg, 2))
