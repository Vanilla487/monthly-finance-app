import { parse as parseCsv } from 'csv-parse/sync'
import { parseGermanAmount, parseGermanDate } from './germanFormat.js'

// apoBank online banking "Buchungsliste" export of the account (Girokonto).
// The credit card export uses the same columns — see apobank-card.js.
//   Datum;Name;Verwendungszweck;Auftragsart;Betrag (EUR);Saldo (EUR)
//   30.09.2026;"PayPal Europe ...";"... Ihr Einkauf bei Spotify AB";Lastschrift;"-12,99";"2.402,51"
//
// Quirks seen in real exports:
// - `;` delimiter, German dates (dd.mm.yyyy) and amounts ("1.234,56"), all quoted
// - Some exports are Windows-1252, others UTF-8 (decoding happens before the parser)
// - Name / Verwendungszweck sometimes have leading spaces
// - Credit card settlements put the text in Name and leave Verwendungszweck empty
// - PayPal rows all share the PayPal company name; the merchant is only in Verwendungszweck
// - apoBank has no debit card, so card spending arrives as one "Kreditkartenabrechnung"
//   row a month later. Those rows are flagged `isCardSettlement` so the import can drop
//   them when the credit card export is uploaded alongside (see combineCardStatement.js).

const HEADER_START = 'Datum;Name;Verwendungszweck'
const REQUIRED_COLUMNS = ['Datum', 'Name', 'Verwendungszweck', 'Betrag (EUR)']

// Payees that are just a payment intermediary — the real merchant is in the reference.
const INTERMEDIARY_PATTERN = /^paypal\b/i

function pickDescription(name, reference) {
  if (name && reference && INTERMEDIARY_PATTERN.test(name)) return reference
  return name || reference || ''
}

// Card purchases in the credit card export (same columns as the account export)
export const CARD_BOOKING = 'Kreditkartenbuchung'

// Reads either apoBank export (account or credit card — both share these columns)
// into raw CSV records, with the format checks both need.
export function readApoBankRecords(fileContent) {
  const content = fileContent.replace(/^\uFEFF/, '')
  const lines = content.split(/\r?\n/)

  // Skip any metadata lines above the header row
  const headerIndex = lines.findIndex((line) => line.replace(/"/g, '').startsWith(HEADER_START))
  if (headerIndex === -1) {
    throw new Error(
      `File doesn't match expected apoBank format — missing columns: ${REQUIRED_COLUMNS.join(', ')}`
    )
  }

  const records = parseCsv(lines.slice(headerIndex).join('\n'), {
    columns: (header) => header.map((col) => col.trim()),
    delimiter: ';',
    skip_empty_lines: true,
    relax_column_count: true
  })

  if (records.length === 0) {
    throw new Error('CSV appears to be empty')
  }

  const missingColumns = REQUIRED_COLUMNS.filter((col) => !(col in records[0]))
  if (missingColumns.length > 0) {
    throw new Error(
      `File doesn't match expected apoBank format — missing columns: ${missingColumns.join(', ')}`
    )
  }

  return records
    .filter((row) => row['Datum'] && row['Betrag (EUR)'])
    .map((row) => ({
      date: parseGermanDate(row['Datum'].trim()),
      name: (row['Name'] || '').trim(),
      reference: (row['Verwendungszweck'] || '').trim(),
      orderType: (row['Auftragsart'] || '').trim(),
      amount: parseGermanAmount(row['Betrag (EUR)'])
    }))
}

export function parse(fileContent) {
  const records = readApoBankRecords(fileContent)

  // Both exports share the same columns, so catch the card file in the account slot
  if (records.every((r) => r.orderType === CARD_BOOKING)) {
    throw new Error(
      'This looks like the apoBank credit card export, not the account statement — upload it as the credit card file'
    )
  }

  return records.map((r) => ({
    date: r.date,
    rawDescription: pickDescription(r.name, r.reference),
    amount: Math.abs(r.amount),
    isOutflow: r.amount < 0,
    isCardSettlement: r.orderType === 'Kreditkartenabrechnung'
  }))
}
