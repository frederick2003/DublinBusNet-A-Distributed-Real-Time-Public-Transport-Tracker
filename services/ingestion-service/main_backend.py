print("[Backend Ingestion] main_backend.py started", flush=True)

import time
import json
from pathlib import Path

from fetch_backend import fetch_trip_updates, fetch_vehicle_positions
from normalise import normalise_trip_updates, normalise_vehicle_positions
from redis_sink import get_client, write_active_buses
from config_backend import POLL_INTERVAL, STATIC_VEH_FILE


def load_static_fallback():
    path = Path(STATIC_VEH_FILE)
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text())
        return data.get("entity", [])
    except Exception:
        return []


def to_bus_records(entities):
    buses = []
    for ent in entities:
        veh = ent.get("vehicle", {})
        pos = veh.get("position", {})
        trip = veh.get("trip", {})

        if "latitude" not in pos or "longitude" not in pos:
            continue

        buses.append(
            {
                "vehicle_id": veh.get("vehicle", {}).get("id")
                or veh.get("id")
                or ent.get("id"),
                "route_id": trip.get("routeId")
                or trip.get("route_id")
                or "UNKNOWN",
                "direction_id": trip.get("directionId")
                or trip.get("direction_id")
                or 0,
                "latitude": pos.get("latitude"),
                "longitude": pos.get("longitude"),
                "last_update": __import__("datetime")
                .datetime.utcnow()
                .isoformat()
                + "Z",
                "delay_seconds": 0,
            }
        )
    return buses


def run_backend_ingestion():
    print("[Backend Ingestion] Entered run loop", flush=True)
    redis_client = get_client()

    while True:
        print("[Backend Ingestion] Polling NTA API...", flush=True)
        veh_raw = fetch_vehicle_positions()
        if not veh_raw:
            veh_raw = load_static_fallback()

        buses = to_bus_records(veh_raw)
        if buses:
            write_active_buses(redis_client, buses)
            print(f"[Backend Ingestion] Wrote {len(buses)} vehicles to Redis.")
        else:
            print(
                "[Backend Ingestion] No vehicles available (API and fallback empty)."
            )

        # Trip updates kept for future backend use
        _ = fetch_trip_updates()

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_backend_ingestion()
