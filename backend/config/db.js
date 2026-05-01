const { Pool } = require('pg')

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        // Neon closes idle connections — keep pool healthy
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      }
    : {
        user:     process.env.DB_USER     || 'postgres',
        host:     process.env.DB_HOST     || 'localhost',
        database: process.env.DB_NAME     || 'PorterSaathi',
        password: process.env.DB_PASSWORD || 'postgres123',
        port:     process.env.DB_PORT     || 5432,
      }
)

// Don't hold a persistent connection — just test once
pool.query('SELECT 1')
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ DB connection error:', err.message))

// Handle unexpected errors without crashing the server
pool.on('error', (err) => {
  console.error('⚠️ Unexpected DB client error (pool will recover):', err.message)
})

module.exports = pool