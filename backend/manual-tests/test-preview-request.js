import { readFileSync } from 'fs'

const csvContent = readFileSync('../parsers/sample-n26.csv', 'utf-8')

const response = await fetch('http://localhost:3000/api/statements/preview', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accountId: 1,
    month: '2026-06',
    csvContent
  })
})

const data = await response.json()
console.log(JSON.stringify(data, null, 2))