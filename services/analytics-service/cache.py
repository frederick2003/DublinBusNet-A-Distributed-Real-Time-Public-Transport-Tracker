import redis
import json

redis_client = redis.Redis(host="localhost", port=6379, db=0)

def cache_route_stop_metrics(route_id, stop_id, data):
    key = f"route_stop:{route_id}:{stop_id}:metrics"
    redis_client.set(key, json.dumps(data), ex=60)

def get_route_stop_metrics(route_id, stop_id):
    key = f"route_stop:{route_id}:{stop_id}:metrics"
    raw = redis_client.get(key)
    return json.loads(raw) if raw else None

