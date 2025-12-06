def map_count_to_busyness(count: int) -> float:
    """
    Map a count of recent events to a busyness rating 0-10.
    """
    if count <= 1:
        return 1.5
    if count <= 3:
        return 4.0
    if count <= 6:
        return 6.5
    if count <= 10:
        return 8.0
    return 9.5
