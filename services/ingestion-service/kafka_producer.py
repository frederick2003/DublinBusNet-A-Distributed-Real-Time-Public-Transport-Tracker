from confluent_kafka import Producer
from config import KAFKA_BROKER

producer = Producer({"bootstrap.servers": KAFKA_BROKER})

def publish(topic, message_json):
    producer.produce(topic, message_json.encode("utf-8"))
    producer.flush()
