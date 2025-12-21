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
