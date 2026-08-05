import db from './db.js'
import { isValidBankType } from './bankRegistry.js'

export function createAccount({ bankType, customName }) {
  if (!isValidBankType(bankType)) {
    throw new Error(`Invalid bank type: ${bankType}`)
  }
  const stmt = db.prepare(
    'INSERT INTO accounts (bank_type, custom_name) VALUES (?, ?)'
  )
  const result = stmt.run(bankType, customName)
  return getAccountById(result.lastInsertRowid)
}

export function getAccountById(id) {
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
}

export function getAllAccounts() {
  return db.prepare('SELECT * FROM accounts ORDER BY created_at DESC').all()
}