import { getAccountById } from './accounts.js'
import { getParserForBankType } from './parsers/index.js'
import { filterToMonth } from './parsers/monthFilter.js'
import { findMatchingRule } from './rules.js'

export function buildStatementPreview({ accountId, month, csvContent }) {
  const account = getAccountById(accountId)
  if (!account) {
    const err = new Error(`No account found with id: ${accountId}`)
    err.statusCode = 404
    throw err
  }

  const parse = getParserForBankType(account.bank_type)

  const parsed = parse(csvContent)
  const inMonth = filterToMonth(parsed, month)
  const expensesOnly = inMonth.filter((txn) => txn.isOutflow)

  const transactions = expensesOnly.map((txn) => {
    const match = findMatchingRule(txn.rawDescription)
    return {
      date: txn.date,
      rawDescription: txn.rawDescription,
      amount: txn.amount,
      categoryId: match?.category_id ?? null,
      categoryName: match?.category_name ?? null,
      ruleId: match?.id ?? null
    }
  })

  return { accountId, month, transactions }
}