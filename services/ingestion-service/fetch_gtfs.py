import requests
from config import BASE_URL
# from config import API_KEY  # Uncomment once API key is available

def fetch_trip_updates():
    # If no API key, return empty list
    # if API_KEY is None:
    #     return []

    url = f"{BASE_URL}/TripUpdates?format=json"
    headers = {
        # "x-api-key": API_KEY  # Uncomment once API key is available
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get("entity", [])
    except Exception:
        return []


def fetch_vehicle_positions():
    # if API_KEY is None:
    #     return []

    url = f"{BASE_URL}/Vehicles?format=json"
    headers = {
        # "x-api-key": API_KEY
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        return response.json().get("entity", [])
    except Exception:
        return []
