import db from './db.js'

export function createStatement({ accountId, month }) {
  const stmt = db.prepare(
    'INSERT INTO statements (account_id, month) VALUES (?, ?)'
  )
  const result = stmt.run(accountId, month)
  return getStatementById(result.lastInsertRowid)
}

export function getStatementById(id) {
  return db.prepare('SELECT * FROM statements WHERE id = ?').get(id)
}

export function getAllStatements() {
  return db
    .prepare(
      `SELECT statements.*, accounts.bank_type, accounts.custom_name
       FROM statements
       JOIN accounts ON accounts.id = statements.account_id
       ORDER BY statements.month DESC`
    )
    .all()
}

export function findStatementByAccountAndMonth(accountId, month) {
  return db
    .prepare('SELECT * FROM statements WHERE account_id = ? AND month = ?')
    .get(accountId, month)
}

export function deleteStatement(id) {
  db.prepare('DELETE FROM statements WHERE id = ?').run(id)
}