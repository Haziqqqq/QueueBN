require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'seed-generic.sql'), 'utf8')
  await db.query(sql)
  const { rows } = await db.query('SELECT name, code FROM departments ORDER BY name')
  console.log('Reseeded with generic queues:', rows.length)
  rows.forEach((r) => console.log(`  - ${r.name} (${r.code})`))
  await db.end()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
