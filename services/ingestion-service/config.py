import os

# NTA API key (set via environment variable)
NTA_API_KEY = os.getenv("NTA_API_KEY", "").strip() # Put API key here (NTA_API_KEY, ...)

# GTFS-Realtime combined feed endpoint
BASE_URL = "https://api.nationaltransport.ie/gtfsr/v2/gtfsr"

# Polling interval in seconds
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "30")) # Reduce message volume by changing this value

# Kafka / Redpanda configuration
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TRIP_TOPIC = os.getenv("KAFKA_TOPIC", "bus_updates")
KAFKA_VEHICLE_TOPIC = os.getenv("KAFKA_VEHICLE_TOPIC", "vehicle_positions")


print(f"[Analytics] Kafka broker: {KAFKA_BROKER}")
print(f"[Analytics] Kafka trip topic: {KAFKA_TRIP_TOPIC}")
print(f"[Analytics] Kafka vehicle topic: {KAFKA_VEHICLE_TOPIC}")