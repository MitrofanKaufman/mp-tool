const knex = require('knex');
const { knexSnakeCaseMappers } = require('objection');

const config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'wbapp',
    timezone: 'UTC',
    charset: 'utf8mb4',
  },
  pool: {
    min: 2,
    max: 10,
  },
  ...knexSnakeCaseMappers(),
};

// Create the database connection
const db = knex(config);

// Test the database connection
const testConnection = async () => {
  try {
    await db.raw('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

module.exports = {
  db,
  testConnection,
  config,
};
