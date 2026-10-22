import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { parse as parseAccount } from './apobank.js'
import { parse as parseCard } from './apobank-card.js'
import { combineWithCardStatement } from './combineCardStatement.js'
import { filterToMonth } from './monthFilter.js'

const read = (name) => readFileSync(new URL(name, import.meta.url), 'latin1')
const account = parseAccount(read('./sample-apobank.csv'))
const card = parseCard(read('./sample-apobank-card.csv'))

const combined = combineWithCardStatement(account, card)

// The card bill is gone from both sides: the account's lump-sum debit and the
// card's matching payoff credit
assert.ok(!combined.some((t) => t.isCardSettlement))
assert.ok(!combined.some((t) => t.rawDescription.includes('KARTENDOPPEL')))
assert.equal(combined.length, account.length - 1 + card.length - 1)

// Card purchases are in
assert.ok(combined.some((t) => t.rawDescription === 'C.TOWN 7TH CIRCLE. JO AMMAN'))

// Newest first, like the bank exports
const dates = combined.map((t) => t.date)
assert.deepEqual(dates, [...dates].sort().reverse())

// September spending = account outflows without the €643.71 bill + September card purchases
const september = filterToMonth(combined, '2026-09').filter((t) => t.isOutflow)
const total = september.reduce((sum, t) => sum + t.amount, 0)
console.log(`September spending: ${total.toFixed(2)}`)
assert.equal(total.toFixed(2), (3416.28 - 643.71 + 207.63).toFixed(2))

console.log('All combineCardStatement tests passed')
