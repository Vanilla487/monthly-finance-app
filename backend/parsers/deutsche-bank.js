import { parse as parseCsv } from 'csv-parse/sync'
import { parseGermanAmount, parseGermanDate } from './germanFormat.js'

export function parse(fileContent) {
  const lines = fileContent.split('\n')

  const headerIndex = lines.findIndex((line) => line.startsWith('Buchungstag;'))
  if (headerIndex === -1) {
    throw new Error('Could not find expected header row in file')
  }

  const dataSection = lines.slice(headerIndex).join('\n')

  const records = parseCsv(dataSection, {
    columns: true,
    delimiter: ';',
    skip_empty_lines: true,
    relax_column_count: true
  })

  const validRecords = records.filter(
    (row) => row['Betrag'] !== undefined && row['Betrag'] !== ''
  )

  return validRecords.map((row) => {
    const amount = parseGermanAmount(row['Betrag'])
    const rawDescription = row['Verwendungszweck'] || row['Begünstigter / Auftraggeber'] || ''
    return {
      date: parseGermanDate(row['Buchungstag']),
      rawDescription,
      amount: Math.abs(amount),
      isOutflow: amount < 0
    }
  })
}