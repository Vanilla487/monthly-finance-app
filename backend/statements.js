import db from './db.js'
import { SPENDING_SQL, INCOME_SQL, COUNTS_AS_SPENDING_SQL } from './moneyFlow.js'

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
  const statements = db
    .prepare(
      `SELECT
         statements.*,
         accounts.bank_type,
         accounts.custom_name,
         COALESCE(SUM(${SPENDING_SQL}), 0) AS total,
         COALESCE(SUM(${INCOME_SQL}), 0) AS total_in
       FROM statements
       JOIN accounts ON accounts.id = statements.account_id
       LEFT JOIN transactions ON transactions.statement_id = statements.id
       GROUP BY statements.id
       ORDER BY statements.month DESC`
    )
    .all()

  const breakdownRows = db
    .prepare(
      `SELECT
         transactions.statement_id,
         categories.name AS category_name,
         categories.color AS category_color,
         SUM(${SPENDING_SQL}) AS total
       FROM transactions
       LEFT JOIN categories ON categories.id = transactions.category_id
       WHERE ${COUNTS_AS_SPENDING_SQL}
       GROUP BY transactions.statement_id, transactions.category_id`
    )
    .all()

  const breakdownByStatement = {}
  for (const row of breakdownRows) {
    if (!breakdownByStatement[row.statement_id]) {
      breakdownByStatement[row.statement_id] = []
    }
    breakdownByStatement[row.statement_id].push({
      name: row.category_name ?? 'Uncategorized',
      color: row.category_color ?? 'grey',
      total: row.total
    })
  }

  return statements.map((s) => ({
    ...s,
    categoryBreakdown: breakdownByStatement[s.id] ?? []
  }))
}

export function findStatementByAccountAndMonth(accountId, month) {
  return db
    .prepare('SELECT * FROM statements WHERE account_id = ? AND month = ?')
    .get(accountId, month)
}

export function deleteStatement(id) {
  db.prepare('DELETE FROM statements WHERE id = ?').run(id)
}