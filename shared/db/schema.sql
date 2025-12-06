CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. Vehicle Positions
CREATE TABLE vehicle_positions (
    id SERIAL PRIMARY KEY,
    vehicle_id TEXT,
    route_id TEXT,
    direction_id INT,
    position GEOGRAPHY(POINT),
    last_update TIMESTAMP,
    delay_seconds INT
);

-- 2. Trip Updates
CREATE TABLE trip_updates (
    id SERIAL PRIMARY KEY,
    trip_id TEXT,
    route_id TEXT,
    stop_id TEXT,
    arrival_delay INT,
    departure_delay INT,
    timestamp TIMESTAMP
);

-- 3. Predictions
CREATE TABLE predictions (
    id SERIAL PRIMARY KEY,
    type TEXT, -- 'bus' or 'stop'
    target_id TEXT,
    route_id TEXT,
    predicted_value FLOAT,
    confidence FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);
