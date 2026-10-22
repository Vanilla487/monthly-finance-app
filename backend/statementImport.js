import { getAccountById } from './accounts.js'
import { getParserForBankType, getCardParserForBankType } from './bankRegistry.js'
import { filterToMonth } from './parsers/monthFilter.js'
import { combineWithCardStatement } from './parsers/combineCardStatement.js'
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

export function buildStatementPreview({ accountId, month, csvContent, cardCsvContent }) {
  const account = getAccountById(accountId)
  if (!account) {
    const err = new Error(`No account found with id: ${accountId}`)
    err.statusCode = 404
    throw err
  }

  const parse = getParserForBankType(account.bank_type)
  const accountParsed = parse(csvContent)

  // Month comes from the account statement; the card export may span a billing
  // period that crosses month boundaries, so it doesn't get a vote.
  const effectiveMonth = month || inferMonth(accountParsed)
  if (!effectiveMonth) {
    const err = new Error('Could not determine a month — CSV has no transactions')
    err.statusCode = 400
    throw err
  }

  let parsed = accountParsed
  if (cardCsvContent) {
    const parseCard = getCardParserForBankType(account.bank_type)
    parsed = combineWithCardStatement(accountParsed, parseCard(cardCsvContent))
  }

  // Card bill rows (account debit or card payoff credit) are never real money in or out:
  // without the card file the account's bill row is the only record of card spending,
  // so it's only dropped once combineWithCardStatement has replaced it.
  const inMonth = filterToMonth(parsed, effectiveMonth).filter(
    (txn) => txn.isOutflow || !txn.isCardSettlement
  )

  const transactions = inMonth.map((txn) => {
    // Rules categorise spending only; incoming money starts uncategorised and gets a
    // category if the user marks it as a refund.
    const match = txn.isOutflow ? findMatchingRule(txn.rawDescription) : null
    return {
      date: txn.date,
      rawDescription: txn.rawDescription,
      amount: txn.amount,
      direction: txn.isOutflow ? 'out' : 'in',
      categoryId: match?.category_id ?? null,
      categoryName: match?.category_name ?? null,
      categoryColor: match?.category_color ?? null,
      ruleId: match?.id ?? null
    }
  })

  return { accountId, month: effectiveMonth, transactions }
}