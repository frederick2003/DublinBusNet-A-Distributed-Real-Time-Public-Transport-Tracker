import psycopg2
from config import DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD


def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )


def insert_trip_update(data):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO trip_updates (
            trip_id,
            route_id,
            stop_id,
            arrival_delay,
            departure_delay,
            timestamp
        ) VALUES (%s, %s, %s, %s, %s, to_timestamp(%s))
    """, (
        data.get("trip_id"),
        data.get("route_id"),
        data.get("stop_id"),
        data.get("arrival_delay"),
        data.get("departure_delay"),
        data.get("timestamp_utc"),
    ))

    conn.commit()
    cur.close()
    conn.close()


def insert_vehicle_position(data):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO vehicle_positions (
            vehicle_id,
            route_id,
            direction_id,
            position,
            last_update,
            delay_seconds
        ) VALUES (
            %s, %s, %s,
            ST_GeogFromText('POINT(%s %s)'),
            to_timestamp(%s),
            %s
        )
    """, (
        data.get("vehicle_id"),
        data.get("route_id"),
        data.get("direction_id"),
        data.get("longitude"),
        data.get("latitude"),
        data.get("timestamp_utc"),
        data.get("arrival_delay", 0)
    ))

    conn.commit()
    cur.close()
    conn.close()
