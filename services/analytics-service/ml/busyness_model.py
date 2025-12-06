def predict_busyness(recent_bus_count):
    # simple baseline tool based on features that will be replaced by more complex models
    if recent_bus_count <= 2:
        return 2.5
    elif recent_bus_count <= 5:
        return 5.0
    elif recent_bus_count <= 8:
        return 7.5
    else:
        return 9.0
