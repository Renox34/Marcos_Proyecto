const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const schema = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT,
    avatar_url TEXT,
    style_preferences JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS garments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150),
    category VARCHAR(50),
    color VARCHAR(50),
    brand VARCHAR(100),
    image_url TEXT NOT NULL,
    original_url TEXT,
    tags TEXT[],
    times_worn INTEGER DEFAULT 0,
    last_worn DATE,
    purchase_date DATE,
    price DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS outfits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150),
    garment_ids INTEGER[],
    occasion VARCHAR(100),
    season VARCHAR(50),
    thumbnail_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS calendar_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    outfit_id INTEGER REFERENCES outfits(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    notes TEXT,
    UNIQUE(user_id, date)
  );

  CREATE TABLE IF NOT EXISTS style_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    style_name VARCHAR(100),
    active BOOLEAN DEFAULT TRUE
  );

  CREATE TABLE IF NOT EXISTS purchase_recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(200),
    style_category VARCHAR(100),
    estimated_price DECIMAL(10,2),
    buy_link TEXT,
    best_season_to_buy VARCHAR(50),
    reason TEXT,
    saved_at TIMESTAMP DEFAULT NOW()
  );
`;

async function initDB() {
  try {
    await pool.query(schema);
    console.log('✓ Base de datos inicializada correctamente');
  } catch (err) {
    console.error('✗ Error inicializando la base de datos:', err.message);
    process.exit(1);
  }
}

module.exports = { pool, initDB };
