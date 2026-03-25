const { Pool } = require('pg')

const pool = new Pool({
  user:     process.env.DB_USER     || 'postgres',
  host:     process.env.DB_HOST     || 'localhost',
  database: process.env.DB_NAME     || 'PorterSaathi',
  password: process.env.DB_PASSWORD,
  port:     process.env.DB_PORT     || 5432,
})

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ DB connection error:', err.message))

module.exports = pool