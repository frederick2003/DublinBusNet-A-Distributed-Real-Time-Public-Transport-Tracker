from db_writer import insert_trip_update, insert_vehicle_position


def process_message(msg):
    msg_type = msg.get("type")

    print(f"[Analytics] Received message: {msg_type}")

    if msg_type == "trip_update":
        insert_trip_update(msg)
        print("[Analytics] Inserted trip update")

    elif msg_type == "vehicle_position":
        insert_vehicle_position(msg)
        print("[Analytics] Inserted vehicle position")

    else:
        print(f"[Analytics] Unknown message type: {msg_type}")
