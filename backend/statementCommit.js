import db from './db.js'
import { findStatementByAccountAndMonth, createStatement, deleteStatement } from './statements.js'
import { createTransaction, deleteTransactionsByStatement, getTransactionsByStatement } from './transactions.js'

export function commitStatement({ accountId, month, transactions }) {
  const existing = findStatementByAccountAndMonth(accountId, month)

  const commit = db.transaction(() => {
    // Hand-added transactions aren't in any bank file, so a re-upload carries them over.
    const manualTransactions = existing
      ? getTransactionsByStatement(existing.id).filter((t) => t.is_manual)
      : []

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

    for (const t of manualTransactions) {
      createTransaction({
        statementId: statement.id,
        date: t.date,
        rawDescription: t.raw_description,
        displayName: t.display_name,
        amount: t.amount,
        direction: t.direction,
        isRefund: !!t.is_refund,
        isManual: true,
        categoryId: t.category_id,
        ruleId: null
      })
    }

    return statement
  })

  const statement = commit()
  return { statement, replaced: !!existing }
}