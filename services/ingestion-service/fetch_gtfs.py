import requests
from google.transit import gtfs_realtime_pb2
from config import BASE_URL, NTA_API_KEY


class GTFSFetchError(Exception):
    pass


def fetch_gtfs_feed() -> gtfs_realtime_pb2.FeedMessage:
    """
    Fetches the GTFS-Realtime protobuf feed from the NTA API.
    Returns a parsed FeedMessage object.
    """
    if not NTA_API_KEY:
        raise GTFSFetchError(
            "NTA_API_KEY is not set. Please set it as an environment variable."
        )

    headers = {
        "Cache-Control": "no-cache",
        "x-api-key": NTA_API_KEY,
    }

    try:
        resp = requests.get(BASE_URL, headers=headers, timeout=10)
        resp.raise_for_status()
    except Exception as e:
        raise GTFSFetchError(f"Error fetching GTFS feed: {e}")

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)
    return feed

def fetch_vehicle_positions() -> gtfs_realtime_pb2.FeedMessage:
    if not NTA_API_KEY:
        raise RuntimeError("NTA_API_KEY not set")

    url = "https://api.nationaltransport.ie/gtfsr/v2/Vehicles"
    headers = {
        "Cache-Control": "no-cache",
        "x-api-key": NTA_API_KEY,
    }

    resp = requests.get(url, headers=headers, timeout=10)
    resp.raise_for_status()

    feed = gtfs_realtime_pb2.FeedMessage()
    feed.ParseFromString(resp.content)

    return feed