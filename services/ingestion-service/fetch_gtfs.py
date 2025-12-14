import requests
from config import BASE_URL, NTA_API_KEY


def fetch_trip_updates():
    if not NTA_API_KEY:
        return []

    url = f"{BASE_URL}/TripUpdates?format=json"
    headers = {"x-api-key": NTA_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("entity", [])
    except Exception:
        return []


def fetch_vehicle_positions():
    if not NTA_API_KEY:
        return []

    url = f"{BASE_URL}/Vehicles?format=json"
    headers = {"x-api-key": NTA_API_KEY}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json().get("entity", [])
    except Exception:
        return []
