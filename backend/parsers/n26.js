import { parse as parseCsv } from 'csv-parse/sync'

export function parse(fileContent) {
  const records = parseCsv(fileContent, {
    columns: true,
    skip_empty_lines: true
  })

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