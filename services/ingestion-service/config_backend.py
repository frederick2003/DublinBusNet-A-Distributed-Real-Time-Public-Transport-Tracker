import os

NTA_API_KEY = os.getenv("NTA_API_KEY")

BACKEND_BASE_URL = "https://api.nationaltransport.ie/gtfsr/v2"

POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "30"))

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")
BUS_KEY = os.getenv("BUS_KEY", "bus:active")
BUS_TTL = int(os.getenv("BUS_TTL", 90))

STATIC_VEH_FILE = os.getenv(
    "STATIC_VEH_FILE",
    "/app/data/vehicles_test.json"
)