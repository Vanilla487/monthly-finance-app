import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { parse, describeCardBooking } from './apobank-card.js'
import { parse as parseAccount } from './apobank.js'
import { isValidParsedTransaction } from './types.js'
import { filterToMonth } from './monthFilter.js'

const read = (name) => readFileSync(new URL(name, import.meta.url), 'latin1')

// --- Test 1: real card export rows parse correctly ---
const results = parse(read('./sample-apobank-card.csv'))
console.log('Parsed:', results.map((t) => `${t.date} ${t.amount} ${t.rawDescription}`))

assert.equal(results.length, 10)
assert.ok(results.every(isValidParsedTransaction), 'every row has a valid shape')

// Merchant text pulled out of the packed Verwendungszweck
assert.deepEqual(results.map((t) => t.rawDescription), [
  'ORANGE JO AMMAN',                         // JOD, Visa
  'APPLE.COM/BILL IE 08006645451',           // EUR with "Umsatz vom"
  'UBER *TRIP NLD HELP.UBER.COM',            // USD, Mastercard
  'FLOUR & FIRE JO AMMAN',                   // EUR abroad, no exchange rate
  'Abrechnung vom 07.09.2026 KARTENDOPPEL',  // card paid off from the account
  'C.TOWN 7TH CIRCLE. JO AMMAN',
  'UBER *TRIP HELP.UBER.C NLD Vorden',
  'Erste Lebensmittelmarkt DE M?nster',
  'DM DROGERIE SAGT DANKE DE Muenster',
  'Jahresbeitrag'                            // annual card fee
])

// Betrag already includes the foreign-currency fee
assert.equal(results.find((t) => t.rawDescription.startsWith('C.TOWN')).amount, 65.93)

// Only the payoff is flagged; it's money in, so never spending
const settlements = results.filter((t) => t.isCardSettlement)
assert.equal(settlements.length, 1)
assert.equal(settlements[0].amount, 643.71)
assert.equal(settlements[0].isOutflow, false)
assert.equal(results.filter((t) => !t.isOutflow).length, 1)

// Booking date decides the month: 01.10 rows aren't September spending
const september = filterToMonth(results, '2026-09').filter((t) => t.isOutflow)
assert.equal(september.length, 7)
assert.equal(september.reduce((s, t) => s + t.amount, 0).toFixed(2), '207.63')

// --- Test 2: description edge cases ---
assert.equal(describeCardBooking('0000 EUR SUPERMARKET AL AHLAM JO  JO JOD   4,00 KURS: 0,788955'), 'SUPERMARKET AL AHLAM JO JO')
assert.equal(describeCardBooking('something unexpected'), 'something unexpected')

// --- Test 3: the two apoBank exports can't be swapped ---
assert.throws(() => parse(read('./sample-apobank.csv')), /doesn't look like the apoBank credit card export/)
assert.throws(() => parseAccount(read('./sample-apobank-card.csv')), /looks like the apoBank credit card export/)

// --- Test 4: other banks' files throw the format error ---
assert.throws(() => parse(read('./sample-n26.csv')), /doesn't match expected apoBank format/)

console.log('All apoBank credit card parser tests passed')
