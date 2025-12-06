from fastapi import FastAPI, Query
from db_writer import fetch_recent_trip_delays
from ml.delay_model import predict_delay_seconds
from ml.busyness_model import map_count_to_busyness

app = FastAPI(title="DublinBusNet Analytics Service")

@app.get("/predict/stop/busyness")
def predict_stop_busyness(
    route_id: str = Query(...),
    stop_id: str = Query(...)
):
    """
    Predict how busy a stop is likely to be, based on recent trip updates.
    """
    recent_rows = fetch_recent_trip_delays(route_id, stop_id, limit=50)
    delay_pred = predict_delay_seconds(recent_rows)
    busy_score = map_count_to_busyness(len(recent_rows))

    return {
        "success": True,
        "data": {
            "route_id": route_id,
            "stop_id": stop_id,
            "predicted_delay_seconds": delay_pred,
            "busy_rating": busy_score,
            "confidence": 0.75  # placeholder heuristic
        }
    }

@app.get("/predict/bus/busyness")
def predict_bus_busyness(
    route_id: str = Query(...),
    vehicle_id: str = Query(...),
    stop_id: str | None = Query(None)
):
    """
    Predict how busy a bus is likely to be.
    For now, we just reuse stop-level statistics if stop_id is given.
    """
    recent_rows = []
    if stop_id:
        recent_rows = fetch_recent_trip_delays(route_id, stop_id, limit=50)

    delay_pred = predict_delay_seconds(recent_rows)
    busy_score = map_count_to_busyness(len(recent_rows))

    return {
        "success": True,
        "data": {
            "vehicle_id": vehicle_id,
            "route_id": route_id,
            "stop_id": stop_id,
            "predicted_delay_seconds": delay_pred,
            "busy_rating": busy_score,
            "confidence": 0.7  # placeholder heuristic
        }
    }
