import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { parse } from './apobank.js'
import { isValidParsedTransaction } from './types.js'
import { filterToMonth } from './monthFilter.js'

// Real apoBank exports are sometimes Windows-1252 (this sample is), sometimes UTF-8.
// The upload modal decodes the bytes before they reach the parser; mirror that here.
const bytes = readFileSync(new URL('./sample-apobank.csv', import.meta.url))
const fileContent = new TextDecoder('windows-1252').decode(bytes)

// --- Test 1: real (anonymised) file parses correctly ---
const results = parse(fileContent)
console.log(`Parsed ${results.length} rows`)
console.log('First 3:', results.slice(0, 3))

assert.equal(results.length, 23)
assert.ok(results.every(isValidParsedTransaction), 'every row has a valid shape')

const outflows = results.filter((t) => t.isOutflow)
const inflows = results.filter((t) => !t.isOutflow)
console.log(`Outflows: ${outflows.length}, Inflows: ${inflows.length}`)
assert.equal(outflows.length, 21)
assert.deepEqual(inflows.map((t) => t.amount), [349.87, 800])

// Amounts: thousands separator, positive values
const rent = results.find((t) => t.rawDescription.startsWith('GWN'))
assert.equal(rent.amount, 669)
assert.equal(rent.date, '2026-09-29')
const card = results.find((t) => t.rawDescription.includes('KARTENDOPPEL'))
assert.equal(card.amount, 643.71)

// Umlauts survive Windows-1252 decoding
assert.ok(results.some((t) => t.rawDescription === 'Universität Münster'))

// PayPal rows use the reference so the merchant is visible
const spotify = results.find((t) => t.date === '2026-09-15' && t.amount === 12.99)
assert.match(spotify.rawDescription, /Spotify AB/)
assert.ok(!results.some((t) => t.rawDescription.startsWith('PayPal')))

// Leading spaces trimmed
assert.ok(results.some((t) => t.rawDescription === 'Max Musterfrau'))

const september = filterToMonth(results, '2026-09').filter((t) => t.isOutflow)
const total = september.reduce((sum, t) => sum + t.amount, 0)
console.log(`September outflow total: ${total.toFixed(2)}`)
assert.equal(total.toFixed(2), '3416.28')

// --- Test 2: UTF-8 with BOM, CRLF and metadata lines above the header ---
const utf8 = [
  '﻿Kontoumsätze',
  '',
  'Datum;Name;Verwendungszweck;Auftragsart;Betrag (EUR);Saldo (EUR)',
  '01.10.2026;"Rundfunk ARD, ZDF, DRadio";"Rundfunk 10.2026 - 12.2026";Lastschrift;"-55,08";"331,56"',
  '22.10.2026;Erika Mustermann;Urlaub;interne Zahlung;"1.000,00";"902,00"',
  ''
].join('\r\n')
const utf8Results = parse(utf8)
assert.deepEqual(utf8Results, [
  { date: '2026-10-01', rawDescription: 'Rundfunk ARD, ZDF, DRadio', amount: 55.08, isOutflow: true },
  { date: '2026-10-22', rawDescription: 'Erika Mustermann', amount: 1000, isOutflow: false }
])

// --- Test 3: other banks' files throw a clear format error ---
const n26 = readFileSync(new URL('./sample-n26.csv', import.meta.url), 'utf-8')
const db = readFileSync(new URL('../sample-deutsche-bank.csv', import.meta.url), 'utf-8')
for (const [label, content] of [['N26', n26], ['Deutsche Bank', db], ['junk', 'some,random,columns\n1,2,3']]) {
  assert.throws(() => parse(content), /doesn't match expected apoBank format/, label)
  try { parse(content) } catch (err) { console.log(`Caught expected error (${label}):`, err.message) }
}

console.log('All apoBank parser tests passed')
