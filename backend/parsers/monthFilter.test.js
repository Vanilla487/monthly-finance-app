import { filterToMonth } from './monthFilter.js'

const sample = [
  { date: '2026-05-31', amount: 10 },
  { date: '2026-06-01', amount: 20 },
  { date: '2026-06-30', amount: 30 },
  { date: '2026-07-01', amount: 40 }
]

console.log(filterToMonth(sample, '2026-06'))
// should only show the two June rows