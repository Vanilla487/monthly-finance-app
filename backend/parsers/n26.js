import { parse as parseCsv } from 'csv-parse/sync'

const REQUIRED_COLUMNS = ['Booking Date', 'Partner Name', 'Amount (EUR)']

export function parse(fileContent) {
  const records = parseCsv(fileContent, {
    columns: true,
    skip_empty_lines: true
  })

  if (records.length === 0) {
    throw new Error('CSV appears to be empty')
  }

  const firstRow = records[0]
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !(col in firstRow))
  if (missingColumns.length > 0) {
    throw new Error(
      `File doesn't match expected N26 format — missing columns: ${missingColumns.join(', ')}`
    )
  }

  // The export covers the main account and every Space ("Account Name"). Moving money
  // between them shows up twice — e.g. Main Account -500 to "Emergency Fund" and
  // Emergency Fund +500 from "Main Account" — and the pair cancels out. Neither side is
  // spending or income, so both are flagged and dropped at import. Real people and
  // businesses never match: they aren't Spaces in this file (and usually carry an IBAN).
  const spaceNames = new Set(records.map((row) => row['Account Name']).filter(Boolean))

  return records.map((row) => {
    const amount = parseFloat(row['Amount (EUR)'])
    const partner = row['Partner Name'] || ''
    return {
      date: row['Booking Date'],
      rawDescription: partner || row['Payment Reference'] || '',
      amount: Math.abs(amount),
      isOutflow: amount < 0,
      isInternalTransfer: spaceNames.has(partner) && !row['Partner Iban']
    }
  })
}