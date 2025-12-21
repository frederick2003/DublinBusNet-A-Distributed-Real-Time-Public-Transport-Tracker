import time
from fetch_gtfs import fetch_gtfs_feed,fetch_vehicle_positions, GTFSFetchError
from normalise import normalise_trip_updates, normalise_vehicle_positions
from kafka_producer import publish_message
from config import KAFKA_TRIP_TOPIC, KAFKA_VEHICLE_TOPIC, POLL_INTERVAL

def run_ingestion():
    print(f"[Ingestion] Starting service. Polling every {POLL_INTERVAL} seconds...")

    while True:
        try:
            trip_feed = fetch_gtfs_feed()
            vehicle_feed = fetch_vehicle_positions()

            trip_msgs = normalise_trip_updates(trip_feed)
            veh_msgs = normalise_vehicle_positions(vehicle_feed)
            print(f"[Ingestion] Normalised {len(veh_msgs)} vehicle positions", flush=True)

            for msg in trip_msgs:
                publish_message(KAFKA_TRIP_TOPIC, msg)

            for msg in veh_msgs:
                publish_message(KAFKA_VEHICLE_TOPIC, msg)
            
            if veh_msgs:
                print(f"[Ingestion] Published {len(veh_msgs)} vehicle positions to Kafka", flush=True)

        except GTFSFetchError as e:
            print(f"[Ingestion ERROR] GTFS fetch error: {e}")
        except Exception as e:
            print(f"[Ingestion ERROR] Unexpected error: {e}")

        time.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    run_ingestion()
