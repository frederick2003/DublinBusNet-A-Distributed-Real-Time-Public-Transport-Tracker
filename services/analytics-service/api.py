from fastapi import FastAPI
from ml.delay_model import predict_delay
from ml.busyness_model import predict_busyness

app = FastAPI()

@app.get("/predict/bus/busyness")
def bus_prediction(vehicle_id: str, route_id: str):
    busy = predict_busyness(5)
    return {
        "success": True,
        "data": {
            "vehicle_id": vehicle_id,
            "route_id": route_id,
            "busy_rating": busy,
            "confidence": 0.92
        }
    }

@app.get("/predict/stop/busyness")
def stop_prediction(stop_id: str, route_id: str):
    busy = predict_busyness(4)
    return {
        "success": True,
        "data": {
            "stop_id": stop_id,
            "route_id": route_id,
            "busy_rating": busy,
            "confidence": 0.88
        }
    }
