import requests
from config_backend import BACKEND_BASE_URL, NTA_API_KEY


def fetch_trip_updates():
    if not NTA_API_KEY:
        return []

    url = f"{BACKEND_BASE_URL}/TripUpdates?format=json"
    headers = {"x-api-key": NTA_API_KEY}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        resp.raise_for_status()
        return resp.json().get("entity", [])
    except Exception:
        return []


def fetch_vehicle_positions():
    if not NTA_API_KEY:
        print("[Backend Fetch] No NTA_API_KEY set", flush=True)
        return []

    url = f"{BACKEND_BASE_URL}/Vehicles?format=json"
    headers = {"x-api-key": NTA_API_KEY}

    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"[Backend Fetch] Status code: {resp.status_code}", flush=True)
        resp.raise_for_status()

        data = resp.json().get("entity", [])
        print(f"[Backend Fetch] Vehicles received: {len(data)}", flush=True)
        return data
    
    except Exception as e:
        print(f"[Backend Fetch ERROR] {e}", flush=True)
        return []
