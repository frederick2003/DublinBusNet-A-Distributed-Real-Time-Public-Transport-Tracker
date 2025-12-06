from typing import List, Dict
from google.transit import gtfs_realtime_pb2

def normalise_trip_updates(feed: gtfs_realtime_pb2.FeedMessage) -> List[Dict]:
    """
    Extracts trip_update entities and normalises into flat JSON records
    for each stop_time_update.
    """
    messages = []
    feed_ts = feed.header.timestamp if feed.header.timestamp else None

    for entity in feed.entity:
        if not entity.HasField("trip_update"):
            continue

        tu = entity.trip_update
        trip = tu.trip

        for stop in tu.stop_time_update:
            arrival_delay = stop.arrival.delay if stop.HasField("arrival") else None
            departure_delay = (
                stop.departure.delay if stop.HasField("departure") else None
            )

            msg = {
                "type": "trip_update",
                "entity_id": entity.id,
                "trip_id": trip.trip_id,
                "route_id": trip.route_id,
                "direction_id": trip.direction_id,
                "stop_id": stop.stop_id,
                "stop_sequence": stop.stop_sequence,
                "arrival_delay": arrival_delay,
                "departure_delay": departure_delay,
                # Prefer trip_update.timestamp, fallback to feed header timestamp
                "timestamp_utc": tu.timestamp or feed_ts,
                "feed_timestamp": feed_ts,
            }

            # Only keep records that have at least trip_id and stop_id
            if msg["trip_id"] and msg["stop_id"]:
                messages.append(msg)

    return messages

def normalise_vehicle_positions(feed: gtfs_realtime_pb2.FeedMessage) -> List[Dict]:
    """
    Extracts vehicle_position entities (if present) and normalises.
    Some NTA feeds might put vehicle info separately; this supports that.
    """
    messages = []
    feed_ts = feed.header.timestamp if feed.header.timestamp else None

    for entity in feed.entity:
        if not entity.HasField("vehicle"):
            continue

        veh = entity.vehicle
        trip = veh.trip
        pos = veh.position

        msg = {
            "type": "vehicle_position",
            "entity_id": entity.id,
            "vehicle_id": veh.vehicle.id if veh.vehicle.id else None,
            "trip_id": trip.trip_id,
            "route_id": trip.route_id,
            "direction_id": trip.direction_id,
            "latitude": pos.latitude if pos.latitude else None,
            "longitude": pos.longitude if pos.longitude else None,
            "bearing": pos.bearing if pos.bearing else None,
            "speed": pos.speed if pos.speed else None,
            "timestamp_utc": veh.timestamp or feed_ts,
            "feed_timestamp": feed_ts,
        }

        if msg["latitude"] is not None and msg["longitude"] is not None:
            messages.append(msg)

    return messages
