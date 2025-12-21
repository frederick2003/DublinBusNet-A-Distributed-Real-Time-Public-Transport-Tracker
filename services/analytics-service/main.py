import time
from kafka_consumer import create_consumer

from processor import process_trip_update

def run_analytics_service():
    print("[Analytics] Starting Kafka consumer...")

    while True:
        try:
            consumer = create_consumer()
            print("[Analytics] Kafka consumer running")

            for msg in consumer:
                process_trip_update(msg.value)

        except Exception as e:
            print(f"[Analytics ERROR] Consumer crashed: {e}")
            print("[Analytics] Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    run_analytics_service()
