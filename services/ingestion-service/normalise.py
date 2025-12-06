import time

def normalise_trip_updates(entities):
    messages = []

    for e in entities:
        tu = e.get("trip_update", {})
        trip = tu.get("trip", {})
        stops = tu.get("stop_time_update", [])

        for stop in stops:
            msg = {
                "type": "trip_update",
                "trip_id": trip.get("trip_id"),
                "route_id": trip.get("route_id"),
                "stop_id": stop.get("stop_id"),
                "arrival_delay": stop.get("arrival", {}).get("delay", 0),
                "departure_delay": stop.get("departure", {}).get("delay", 0),
                "timestamp_utc": int(time.time())
            }
            # Only publish valid entries
            if msg["trip_id"] and msg["stop_id"]:
                messages.append(msg)

    return messages


def normalise_vehicle_positions(entities):
    messages = []

    for e in entities:
        vehicle = e.get("vehicle", {})
        pos = vehicle.get("position", {})
        msg = {
            "type": "vehicle_position",
            "vehicle_id": vehicle.get("id"),
            "trip_id": vehicle.get("trip", {}).get("trip_id"),
            "latitude": pos.get("latitude"),
            "longitude": pos.get("longitude"),
            "bearing": pos.get("bearing"),
            "timestamp_utc": vehicle.get("timestamp"),
        }
        if msg["latitude"] and msg["longitude"]:
            messages.append(msg)

    return messages
