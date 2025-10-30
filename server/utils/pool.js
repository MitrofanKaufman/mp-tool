/**
 * Database connection pool manager
 * Handles database connections, connection pooling, and provides query interface
 * @module utils/pool
 */

import knex from 'knex';
import config from '../../config.js';

/**
 * Custom type casting for database fields
 * Converts TINY(1) to boolean automatically
 */
const typeCast = (field, next) =>
    field.type === 'TINY' && field.length === 1 ? field.string() === '1' : next();

/**
 * Connection setup handler
 * Sets timezone to UTC for each new connection
 */
const afterCreate = (conn, done) =>
    conn.query('SET time_zone="+00:00"', (err) => done(err, err ? null : conn));

/**
 * Knex.js database connection pool
 * Configured with MySQL2 driver and connection pooling
 */
const pool = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'api_user',
    password: process.env.DB_PASSWORD || 'api_password',
    database: process.env.DB_NAME || 'api_db',
    timezone: 'UTC',
    charset: 'utf8mb4',
    decimalNumbers: true,
    typeCast,
    ssl: process.env.DB_SSL === 'true' && { rejectUnauthorized: false }
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
    afterCreate
  }
});

/**
 * Tests database connection
 * @returns {Promise<boolean>} True if connection is successful
 * @throws {Error} If connection fails
 */
export async function testConnection() {
  try {
    await pool.raw('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Gracefully shuts down the connection pool
 * Should be called when application is shutting down
 * @returns {Promise<void>}
 */
export async function shutdown() {
  if (pool) {
    await pool.destroy().catch(console.error);
  }
}

// Handle graceful shutdown
['SIGTERM', 'SIGINT'].forEach(signal =>
    process.once(signal, async () => {
      console.log(`\n${signal} received, shutting down database connections...`);
      await shutdown();
      process.exit(0);
    })
);

// Export the pool as both default and named export
export { pool as knex, pool as default };
