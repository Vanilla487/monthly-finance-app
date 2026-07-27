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

  return records.map((row) => {
    const amount = parseFloat(row['Amount (EUR)'])
    return {
      date: row['Booking Date'],
      rawDescription: row['Partner Name'] || row['Payment Reference'] || '',
      amount: Math.abs(amount),
      isOutflow: amount < 0
    }
  })
}