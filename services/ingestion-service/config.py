import os

# API_KEY = os.getenv("NTA_API_KEY")  
# When we obtain the API key from NTA, uncomment the line above.

BASE_URL = "https://api.nationaltransport.ie/gtfsr/v2"

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 30))  # default 30 seconds

# Kafka
KAFKA_BROKER = os.getenv("KAFKA_BROKER", "localhost:9092")
KAFKA_TOPIC = "bus_updates"
