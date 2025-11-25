import json
import time

from fetch_gtfs import fetch_trip_updates, fetch_vehicle_positions
from normalise import normalise_trip_updates, normalise_vehicle_positions
from kafka_producer import publish
from config import POLL_INTERVAL, KAFKA_TOPIC


def run_ingestion():
    print(f"[Ingestion] Starting service. Polling every {POLL_INTERVAL} seconds...")

    while True:
        # 1. Fetch data
        trip_raw = fetch_trip_updates()
        veh_raw  = fetch_vehicle_positions()

        # 2. Normalise
        trip_msgs = normalise_trip_updates(trip_raw)
        veh_msgs  = normalise_vehicle_positions(veh_raw)

        all_msgs = trip_msgs + veh_msgs

        # 3. Publish messages
        for msg in all_msgs:
            publish(KAFKA_TOPIC, json.dumps(msg))

        # 4. Logging
        print(f"[Ingestion] Published {len(all_msgs)} messages.")

        # 5. Wait
        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_ingestion()
