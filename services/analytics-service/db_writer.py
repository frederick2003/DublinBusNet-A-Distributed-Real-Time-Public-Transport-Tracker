import psycopg2
from psycopg2.extras import RealDictCursor
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
from decimal import Decimal

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )

def insert_trip_update(data: dict) -> None:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        INSERT INTO trip_updates (
            entity_id,
            trip_id,
            route_id,
            direction_id,
            stop_id,
            stop_sequence,
            arrival_delay,
            departure_delay,
            timestamp,
            feed_timestamp
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s,
                to_timestamp(%s),
                to_timestamp(%s))
        """,
        (
            data.get("entity_id"),
            data.get("trip_id"),
            data.get("route_id"),
            data.get("direction_id"),
            data.get("stop_id"),
            data.get("stop_sequence"),
            data.get("arrival_delay"),
            data.get("departure_delay"),
            data.get("timestamp_utc"),
            data.get("feed_timestamp"),
        ),
    )

    conn.commit()
    cur.close()
    conn.close()

def insert_vehicle_position(data: dict) -> None:
    conn = get_connection()
    cur = conn.cursor()

    latitude = data.get("latitude")
    longitude = data.get("longitude")

    cur.execute(
        """
        INSERT INTO vehicle_positions (
            entity_id,
            vehicle_id,
            trip_id,
            route_id,
            direction_id,
            latitude,
            longitude,
            bearing,
            speed,
            timestamp,
            feed_timestamp,
            geom
        )
        VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s, %s,
            to_timestamp(%s),
            to_timestamp(%s),
            ST_GeogFromText('POINT(' || %s || ' ' || %s || ')')
        )
        """,
        (
            data.get("entity_id"),
            data.get("vehicle_id"),
            data.get("trip_id"),
            data.get("route_id"),
            data.get("direction_id"),
            latitude,
            longitude,
            data.get("bearing"),
            data.get("speed"),
            data.get("timestamp_utc"),
            data.get("feed_timestamp"),
            longitude,
            latitude,
        ),
    )

    conn.commit()
    cur.close()
    conn.close()

def fetch_recent_trip_delays(route_id: str, stop_id: str, limit: int = 50):
    """
    Returns recent arrival_delays for a given route+stop, for use in simple ML.
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        """
        SELECT arrival_delay
        FROM trip_updates
        WHERE route_id = %s
          AND stop_id = %s
          AND arrival_delay IS NOT NULL
        ORDER BY timestamp DESC
        LIMIT %s
        """,
        (route_id, stop_id, limit),
    )

    rows = cur.fetchall()
    cur.close()
    conn.close()
    return rows

def fetch_realtime_features(route_id: str, stop_id: str, window_minutes: int = 15):
    """
    Extract real-time features from Postgres for ML predictions.
    Builds meaningful statistics from live GTFS trip updates.
    """
    conn = get_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute(
        """
        SELECT
            COUNT(*) AS event_count,
            AVG(arrival_delay) AS avg_delay,
            STDDEV(arrival_delay) AS delay_std,
            MIN(arrival_delay) AS min_delay,
            MAX(arrival_delay) AS max_delay,
            EXTRACT(HOUR FROM NOW()) AS hour_of_day,
            EXTRACT(DOW FROM NOW()) AS day_of_week
        FROM trip_updates
        WHERE route_id = %s
          AND stop_id = %s
          AND timestamp >= NOW() - INTERVAL '%s minutes'
        """,
        (route_id, stop_id, window_minutes),
    )

    features = cur.fetchone()
    if features:
        for key, value in features.items():
            if isinstance(value, Decimal):
                features[key] = float(value)
    cur.close()
    conn.close()

    return features
