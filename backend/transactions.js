import db from './db.js'

export function createTransaction({
  statementId,
  date,
  rawDescription,
  displayName,
  amount,
  categoryId = null,
  ruleId = null
}) {
  const stmt = db.prepare(
    `INSERT INTO transactions
     (statement_id, date, raw_description, display_name, amount, category_id, rule_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const result = stmt.run(
    statementId,
    date,
    rawDescription,
    displayName,
    amount,
    categoryId,
    ruleId
  )
  return getTransactionById(result.lastInsertRowid)
}

export function getTransactionById(id) {
  return db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
}

export function getTransactionsByStatement(statementId) {
  return db
    .prepare(
      `SELECT transactions.*, categories.name AS category_name, categories.color AS category_color
       FROM transactions
       LEFT JOIN categories ON categories.id = transactions.category_id
       WHERE statement_id = ?
       ORDER BY date ASC`
    )
    .all(statementId)
}

export function updateTransactionCategory(id, categoryId) {
  db.prepare('UPDATE transactions SET category_id = ? WHERE id = ?').run(
    categoryId,
    id
  )
  return getTransactionById(id)
}

export function deleteTransactionsByStatement(statementId) {
  db.prepare('DELETE FROM transactions WHERE statement_id = ?').run(statementId)
}