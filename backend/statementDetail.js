import { getStatementById } from './statements.js'
import { getAccountById } from './accounts.js'
import { getTransactionsByStatement } from './transactions.js'
import { getWeekBuckets } from './weekBuckets.js'

export function buildStatementDetail(statementId) {
  const statement = getStatementById(statementId)
  if (!statement) {
    const err = new Error(`No statement found with id: ${statementId}`)
    err.statusCode = 404
    throw err
  }

  const account = getAccountById(statement.account_id)
  const transactions = getTransactionsByStatement(statementId)

  const total = transactions.reduce((sum, t) => sum + t.amount, 0)

  const totalsByCategory = {}
  for (const t of transactions) {
    const key = t.category_id ?? 'uncategorized'
    if (!totalsByCategory[key]) {
      totalsByCategory[key] = {
        categoryId: t.category_id ?? null,
        name: t.category_name ?? 'Uncategorized',
        color: t.category_color ?? 'grey',
        total: 0
      }
    }
    totalsByCategory[key].total += t.amount
  }

  const categoryTotals = Object.values(totalsByCategory).map((c) => ({
    ...c,
    percentage: total > 0 ? (c.total / total) * 100 : 0
  }))

  const [year, month] = statement.month.split('-').map(Number)
  const weeks = getWeekBuckets(year, month)

  return {
    statement: {
      id: statement.id,
      accountId: statement.account_id,
      month: statement.month,
      bankType: account?.bank_type,
      customName: account?.custom_name,
      total
    },
    categoryTotals,
    weeks,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.date,
      rawDescription: t.raw_description,
      displayName: t.display_name,
      amount: t.amount,
      categoryId: t.category_id,
      categoryName: t.category_name,
      categoryColor: t.category_color,
      ruleId: t.rule_id
    }))
  }
}