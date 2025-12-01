from kafka import KafkaProducer
import json
import time
# Creates sample Kafka messages for testing the analytics service (Can remove later and replace with real data source)
producer = KafkaProducer(
    bootstrap_servers=["localhost:9092"],
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)

topic = "bus_updates"

sample_messages = [
    {
        "type": "trip_update",
        "trip_id": "TEST_TRIP_001",
        "route_id": "46A",
        "stop_id": "STOP_123",
        "arrival_delay": 120,
        "departure_delay": 90,
        "timestamp_utc": int(time.time())
    },
    {
        "type": "vehicle_position",
        "vehicle_id": "BUS_789",
        "route_id": "46A",
        "direction_id": 1,
        "latitude": 53.3498,
        "longitude": -6.2603,
        "timestamp_utc": int(time.time()),
        "arrival_delay": 120
    },
    {
        "type": "trip_update",
        "trip_id": "TEST_TRIP_002",
        "route_id": "145",
        "stop_id": "STOP_555",
        "arrival_delay": 45,
        "departure_delay": 30,
        "timestamp_utc": int(time.time())
    }
]

for msg in sample_messages:
    producer.send(topic, msg)
    print("Sent:", msg)
    time.sleep(1)

producer.flush()
print("All sample messages sent.")
