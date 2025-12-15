from confluent_kafka import Consumer
import json
from processor import process_message
from config import KAFKA_BROKER, KAFKA_TOPIC, CONSUMER_GROUP

def run_analytics_service():
    consumer = Consumer({
        "bootstrap.servers": KAFKA_BROKER,
        "group.id": CONSUMER_GROUP,
        "auto.offset.reset": "latest"   # prevents reprocessing 100k old messages
    })

    consumer.subscribe([KAFKA_TOPIC])
    print("[Analytics] Kafka consumer running...")

    while True:
        msg = consumer.poll(1.0)

        if msg is None:
            continue
        
        if msg.error():
            print("[Analytics] Kafka error:", msg.error())
            continue

        try:
            data = json.loads(msg.value().decode("utf-8"))
            process_message(data)  # ≤— now metrics will compute!
        except Exception as e:
            print("[Analytics] Failed to process:", e)

if __name__ == "__main__":
    run_analytics_service()
