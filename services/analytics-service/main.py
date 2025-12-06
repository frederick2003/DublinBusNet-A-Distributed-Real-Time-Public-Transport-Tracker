from kafka_consumer import create_consumer
from processor import process_message

def run_analytics_service():
    print("[Analytics] Kafka consumer running...")
    consumer = create_consumer()

    for msg in consumer:
        process_message(msg.value)

if __name__ == "__main__":
    run_analytics_service()
