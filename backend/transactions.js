import db from './db.js'

export function createTransaction({
  statementId,
  date,
  rawDescription,
  displayName,
  amount,
  direction = 'out',
  isRefund = false,
  categoryId = null,
  ruleId = null
}) {
  const stmt = db.prepare(
    `INSERT INTO transactions
     (statement_id, date, raw_description, display_name, amount, direction, is_refund, category_id, rule_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const result = stmt.run(
    statementId,
    date,
    rawDescription,
    displayName,
    amount,
    direction,
    isRefund ? 1 : 0,
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

export function updateTransactionRefund(id, isRefund) {
  db.prepare('UPDATE transactions SET is_refund = ? WHERE id = ?').run(isRefund ? 1 : 0, id)
  return getTransactionById(id)
}

export function deleteTransactionsByStatement(statementId) {
  db.prepare('DELETE FROM transactions WHERE statement_id = ?').run(statementId)
}

export function deleteTransaction(id) {
  const result = db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  return result.changes > 0
}
