from db_writer import insert_trip_update, insert_vehicle_position

# Simple counters for periodic logging
trip_counter = 0
vehicle_counter = 0


def process_message(msg: dict) -> None:
    global trip_counter, vehicle_counter

    msg_type = msg.get("type")

    if msg_type == "trip_update":
        insert_trip_update(msg)
        trip_counter += 1

        # Log once every 500 records
        if trip_counter % 500 == 0:
            print(f"[Analytics] Processed {trip_counter} trip updates")

    elif msg_type == "vehicle_position":
        insert_vehicle_position(msg)
        vehicle_counter += 1

        if vehicle_counter % 200 == 0:
            print(f"[Analytics] Processed {vehicle_counter} vehicle positions")

    else:
        print(f"[Analytics] Unknown message type: {msg_type}")
