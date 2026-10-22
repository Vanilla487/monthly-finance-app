import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { parse } from './apobank.js'
import { combineWithCardStatement } from './combineCardStatement.js'
import { filterToMonth } from './monthFilter.js'

const bytes = readFileSync(new URL('./sample-apobank.csv', import.meta.url))
const account = parse(new TextDecoder('windows-1252').decode(bytes))

// Stand-in card purchases until a real card sample exists
const card = [
  { date: '2026-09-03', rawDescription: 'REWE Markt', amount: 42.1, isOutflow: true },
  { date: '2026-09-20', rawDescription: 'Apple Pay Café', amount: 4.5, isOutflow: true },
  { date: '2026-09-21', rawDescription: 'Refund Zalando', amount: 30, isOutflow: false },
  { date: '2026-08-30', rawDescription: 'Previous billing period', amount: 9.99, isOutflow: true }
]

const combined = combineWithCardStatement(account, card)

// Card bill dropped, card purchases added
assert.ok(!combined.some((t) => t.isCardSettlement))
assert.equal(combined.length, account.length - 1 + card.length)
assert.ok(combined.some((t) => t.rawDescription === 'REWE Markt'))

// Newest first, like the bank exports
const dates = combined.map((t) => t.date)
assert.deepEqual(dates, [...dates].sort().reverse())

// September spending = account outflows without the bill + September card purchases
const september = filterToMonth(combined, '2026-09').filter((t) => t.isOutflow)
const total = september.reduce((sum, t) => sum + t.amount, 0)
assert.equal(total.toFixed(2), (3416.28 - 643.71 + 42.1 + 4.5).toFixed(2))

console.log('All combineCardStatement tests passed')
