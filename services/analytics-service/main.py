from kafka_consumer import create_consumer
from processor import process_message

def run():
    consumer = create_consumer()
    print("[Analytics] Kafka consumer running...")

    for msg in consumer:
        process_message(msg.value)

if __name__ == "__main__":
    run()
