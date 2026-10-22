import assert from 'node:assert/strict'
import { parse } from './n26.js'

// N26 exports include every Space. Moving money between Spaces appears once from
// each side; both rows must be flagged so the pair can be dropped.
const csv = `"Booking Date","Value Date","Partner Name","Partner Iban",Type,"Payment Reference","Account Name","Amount (EUR)","Original Amount","Original Currency","Exchange Rate"
2026-10-21,2026-10-21,"Main Account",,"Credit Transfer",,"Emergency Fund",500.00,,,
2026-10-21,2026-10-21,"Emergency Fund",,"Debit Transfer",,"Main Account",-500.00,,,
2026-10-21,2026-10-21,"Travel 2027",,"Credit Transfer",,"Main Account",2613.86,,,
2026-10-21,2026-10-21,"Main Account",,"Debit Transfer",,"Travel 2027",-2613.86,,,
2026-10-12,2026-10-12,"Lekkerland REWE To Go",,Presentment,,"Main Account",-6.13,6.13,EUR,1
2026-10-02,2026-10-02,"Max Mustermann",DE02120300000000202051,"Credit Transfer","Rent share","Main Account",450.00,,,
2026-10-20,2026-10-20,"Telefonica Germany GmbH + Co. OHG",DE16700202700005713153,"Direct Debit","Tarifrechnung","Travel 2027",-19.99,,,
`

const rows = parse(csv)
const internal = rows.filter((t) => t.isInternalTransfer)
const kept = rows.filter((t) => !t.isInternalTransfer)

// All four Space-to-Space rows flagged, and they cancel out
assert.equal(internal.length, 4)
assert.equal(internal.reduce((s, t) => s + (t.isOutflow ? -t.amount : t.amount), 0), 0)

// Real payments stay — including a person paying in, and a direct debit from a Space
assert.deepEqual(
  kept.map((t) => t.rawDescription),
  ['Lekkerland REWE To Go', 'Max Mustermann', 'Telefonica Germany GmbH + Co. OHG']
)

// A transfer to a Space that isn't in the file (main-account-only export) is kept:
// from the main account's point of view that money really did leave.
const mainOnly = parse(csv.split('\n').filter((l, i) => i === 0 || /"Main Account",-?\d/.test(l)).join('\n'))
assert.equal(mainOnly.filter((t) => t.isInternalTransfer).length, 0)

console.log('All N26 Space transfer tests passed')
