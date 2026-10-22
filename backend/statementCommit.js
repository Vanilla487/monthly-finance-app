import db from './db.js'
import { findStatementByAccountAndMonth, createStatement, deleteStatement } from './statements.js'
import { createTransaction, deleteTransactionsByStatement } from './transactions.js'

export function commitStatement({ accountId, month, transactions }) {
  const existing = findStatementByAccountAndMonth(accountId, month)

  const commit = db.transaction(() => {
    if (existing) {
      deleteTransactionsByStatement(existing.id)
      deleteStatement(existing.id)
    }

    const statement = createStatement({ accountId, month })

    for (const txn of transactions) {
      createTransaction({
        statementId: statement.id,
        date: txn.date,
        rawDescription: txn.rawDescription,
        displayName: txn.rawDescription,
        amount: txn.amount,
        direction: txn.direction === 'in' ? 'in' : 'out',
        isRefund: txn.direction === 'in' && !!txn.isRefund,
        categoryId: txn.categoryId ?? null,
        ruleId: txn.ruleId ?? null
      })
    }

    return statement
  })

  return { statement: commit(), replaced: !!existing }
}