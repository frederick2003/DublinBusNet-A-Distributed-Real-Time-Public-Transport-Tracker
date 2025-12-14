import time
from fetch_gtfs import fetch_gtfs_feed, GTFSFetchError
from normalise import normalise_trip_updates, normalise_vehicle_positions
from kafka_producer import publish_message
from config import POLL_INTERVAL, KAFKA_TOPIC

def run_ingestion():
    print(f"[Ingestion] Starting service. Polling every {POLL_INTERVAL} seconds...")
    redis_client = get_client()

    while True:
        try:
            feed = fetch_gtfs_feed()

            trip_msgs = normalise_trip_updates(feed)
            veh_msgs = normalise_vehicle_positions(feed)

            total = 0
            for msg in trip_msgs + veh_msgs:
                publish_message(KAFKA_TOPIC, msg)
                total += 1

            print(f"[Ingestion] Published {total} messages to topic '{KAFKA_TOPIC}'.")

        except GTFSFetchError as e:
            print(f"[Ingestion ERROR] GTFS fetch error: {e}")
        except Exception as e:
            print(f"[Ingestion ERROR] Unexpected error: {e}")

        time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    run_ingestion()
