from fastapi import FastAPI, Query
from db_writer import fetch_realtime_features
from ml.delay_model import predict_delay_from_features
from ml.busyness_model import predict_busyness_from_features
from cache import get_route_stop_metrics

app = FastAPI(title="DublinBusNet Analytics Service")


@app.get("/predict/stop/busyness")
def predict_stop_busyness(
    route_id: str = Query(...),
    stop_id: str = Query(...)
):
    features = fetch_realtime_features(route_id, stop_id)
    delay = predict_delay_from_features(features)
    busy = predict_busyness_from_features(features)

    return {
        "success": True,
        "data": {
            "route_id": route_id,
            "stop_id": stop_id,
            "predicted_delay_seconds": delay,
            "busy_rating": busy,
            "confidence": 0.85
        },
        "features_used": features
    }


@app.get("/predict/bus/busyness")
def predict_bus_busyness(
    route_id: str = Query(...),
    vehicle_id: str = Query(...),
    stop_id: str = Query(...)
):
    features = fetch_realtime_features(route_id, stop_id)
    delay = predict_delay_from_features(features)
    busy = predict_busyness_from_features(features)

    return {
        "success": True,
        "data": {
            "vehicle_id": vehicle_id,
            "route_id": route_id,
            "stop_id": stop_id,
            "predicted_delay_seconds": delay,
            "busy_rating": busy,
            "confidence": 0.82
        },
        "features_used": features
    }

@app.get("/route/{route_id}/stop/{stop_id}/metrics")
def get_metrics(route_id: str, stop_id: str):
    data = get_route_stop_metrics(route_id, stop_id)
    if not data:
        return {"success": False, "error": "No metrics for this route-stop yet"}
    return {"success": True, "metrics": data}

