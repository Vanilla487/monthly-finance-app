import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.join(__dirname, 'migrations')

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`)

const applied = new Set(
  db.prepare('SELECT id FROM _migrations').all().map((row) => row.id)
)

const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()

for (const file of files) {
  if (applied.has(file)) continue
  console.log(`Applying migration: ${file}`)
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
  db.exec(sql)
  db.prepare('INSERT INTO _migrations (id) VALUES (?)').run(file)
}

console.log('Migrations up to date.')