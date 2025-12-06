CREATE EXTENSION IF NOT EXISTS postgis;

-- Raw / normalised trip updates from GTFS-Realtime
CREATE TABLE IF NOT EXISTS trip_updates (
    id SERIAL PRIMARY KEY,
    entity_id TEXT,
    trip_id TEXT,
    route_id TEXT,
    direction_id INT,
    stop_id TEXT,
    stop_sequence INT,
    arrival_delay INT,
    departure_delay INT,
    timestamp TIMESTAMPTZ,
    feed_timestamp TIMESTAMPTZ
);

-- Vehicle positions (if present in feed)
CREATE TABLE IF NOT EXISTS vehicle_positions (
    id SERIAL PRIMARY KEY,
    entity_id TEXT,
    vehicle_id TEXT,
    trip_id TEXT,
    route_id TEXT,
    direction_id INT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bearing DOUBLE PRECISION,
    speed DOUBLE PRECISION,
    timestamp TIMESTAMPTZ,
    feed_timestamp TIMESTAMPTZ,
    geom GEOGRAPHY(POINT, 4326)
);

-- Basic predictions table (supports both bus and stop level predictions)
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    prediction_type TEXT,      -- 'bus' or 'stop'
    route_id TEXT,
    trip_id TEXT,
    vehicle_id TEXT,
    stop_id TEXT,
    predicted_delay_seconds DOUBLE PRECISION,
    predicted_busyness DOUBLE PRECISION,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_trip_updates_route_time
    ON trip_updates (route_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_trip_updates_stop_time
    ON trip_updates (stop_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_vehicle_positions_geom
    ON vehicle_positions USING GIST (geom);
