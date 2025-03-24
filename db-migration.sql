-- Create geofences table
CREATE TABLE IF NOT EXISTS geofences (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  boundaries JSONB,
  active BOOLEAN DEFAULT TRUE
);

-- Create zones table
CREATE TABLE IF NOT EXISTS zones (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  zone_type TEXT,
  boundaries JSONB,
  active BOOLEAN DEFAULT TRUE
);

-- Create mower_zones table for many-to-many relationship
CREATE TABLE IF NOT EXISTS mower_zones (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  mower_id INTEGER REFERENCES mowers(id),
  zone_id INTEGER REFERENCES zones(id),
  UNIQUE(mower_id, zone_id)
);