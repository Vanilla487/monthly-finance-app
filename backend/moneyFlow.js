// How a stored transaction counts towards a month's totals.
//
//   direction 'out'                 -> spending (+amount)
//   direction 'in', marked refund   -> reduces spending (-amount), under its category
//   direction 'in', not a refund    -> income
//
// Kept in one place so the dashboard (SQL) and statement detail (JS) agree.

export function spendingAmount(txn) {
  if (txn.direction === 'in') return txn.is_refund ? -txn.amount : 0
  return txn.amount
}

export function incomeAmount(txn) {
  return txn.direction === 'in' && !txn.is_refund ? txn.amount : 0
}

export function countsAsSpending(txn) {
  return txn.direction !== 'in' || !!txn.is_refund
}

// SQL equivalents for aggregate queries over the transactions table
export const SPENDING_SQL =
  "CASE WHEN transactions.direction = 'in' THEN CASE WHEN transactions.is_refund = 1 THEN -transactions.amount ELSE 0 END ELSE transactions.amount END"
export const INCOME_SQL =
  "CASE WHEN transactions.direction = 'in' AND transactions.is_refund = 0 THEN transactions.amount ELSE 0 END"
export const COUNTS_AS_SPENDING_SQL =
  "(transactions.direction = 'out' OR transactions.is_refund = 1)"
