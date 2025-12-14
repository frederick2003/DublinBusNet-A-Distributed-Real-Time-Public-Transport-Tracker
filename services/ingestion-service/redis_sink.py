import json
import redis
from typing import List, Dict
from config import REDIS_URL, BUS_KEY, BUS_TTL


def get_client():
    return redis.Redis.from_url(REDIS_URL)


def write_active_buses(client, buses: List[Dict]):
    payload = json.dumps({"buses": buses, "updated_at": __import__("datetime").datetime.utcnow().isoformat()})
    client.setex(BUS_KEY, BUS_TTL, payload)
