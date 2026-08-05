import { getAccountById } from './accounts.js'
import { getParserForBankType } from './bankRegistry.js'
import { filterToMonth } from './parsers/monthFilter.js'
import { findMatchingRule } from './rules.js'

function inferMonth(transactions) {
  const counts = {}
  for (const txn of transactions) {
    const month = txn.date.slice(0, 7)
    counts[month] = (counts[month] || 0) + 1
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0]
}

export function buildStatementPreview({ accountId, month, csvContent }) {
  const account = getAccountById(accountId)
  if (!account) {
    const err = new Error(`No account found with id: ${accountId}`)
    err.statusCode = 404
    throw err
  }

  const parse = getParserForBankType(account.bank_type)
  const parsed = parse(csvContent)

  const effectiveMonth = month || inferMonth(parsed)
  if (!effectiveMonth) {
    const err = new Error('Could not determine a month — CSV has no transactions')
    err.statusCode = 400
    throw err
  }

  const inMonth = filterToMonth(parsed, effectiveMonth)
  const expensesOnly = inMonth.filter((txn) => txn.isOutflow)

  const transactions = expensesOnly.map((txn) => {
    const match = findMatchingRule(txn.rawDescription)
    return {
      date: txn.date,
      rawDescription: txn.rawDescription,
      amount: txn.amount,
      categoryId: match?.category_id ?? null,
      categoryName: match?.category_name ?? null,
      categoryColor: match?.category_color ?? null,
      ruleId: match?.id ?? null
    }
  })

  return { accountId, month: effectiveMonth, transactions }
}