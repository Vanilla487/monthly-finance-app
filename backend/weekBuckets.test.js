import { getWeekBuckets } from './weekBuckets.js'

function check(label, actual, expected) {
  const pass = JSON.stringify(actual) === JSON.stringify(expected)
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}`)
  if (!pass) {
    console.log('  expected:', JSON.stringify(expected))
    console.log('  actual:  ', JSON.stringify(actual))
  }
}

// June 2026: starts Monday, 30 days — no leading fragment, 5 clean Mon-Sun weeks
check('June 2026 (starts Monday)', getWeekBuckets(2026, 6), [
  { weekNumber: 1, startDate: '2026-06-01', endDate: '2026-06-07' },
  { weekNumber: 2, startDate: '2026-06-08', endDate: '2026-06-14' },
  { weekNumber: 3, startDate: '2026-06-15', endDate: '2026-06-21' },
  { weekNumber: 4, startDate: '2026-06-22', endDate: '2026-06-28' },
  { weekNumber: 5, startDate: '2026-06-29', endDate: '2026-06-30' }
])

// February 2026: starts Sunday, 28 days — 1-day leading fragment, 4 more weeks
check('February 2026 (starts Sunday)', getWeekBuckets(2026, 2), [
  { weekNumber: 1, startDate: '2026-02-01', endDate: '2026-02-01' },
  { weekNumber: 2, startDate: '2026-02-02', endDate: '2026-02-08' },
  { weekNumber: 3, startDate: '2026-02-09', endDate: '2026-02-15' },
  { weekNumber: 4, startDate: '2026-02-16', endDate: '2026-02-22' },
  { weekNumber: 5, startDate: '2026-02-23', endDate: '2026-02-28' }
])

// April 2026: starts Wednesday, 30 days — mid-week start, typical 5-week case
check('April 2026 (starts Wednesday)', getWeekBuckets(2026, 4), [
  { weekNumber: 1, startDate: '2026-04-01', endDate: '2026-04-05' },
  { weekNumber: 2, startDate: '2026-04-06', endDate: '2026-04-12' },
  { weekNumber: 3, startDate: '2026-04-13', endDate: '2026-04-19' },
  { weekNumber: 4, startDate: '2026-04-20', endDate: '2026-04-26' },
  { weekNumber: 5, startDate: '2026-04-27', endDate: '2026-04-30' }
])

// August 2026: starts Saturday, 31 days — the 6-week edge case (see chat writeup)
check('August 2026 (starts Saturday, produces 6 weeks)', getWeekBuckets(2026, 8), [
  { weekNumber: 1, startDate: '2026-08-01', endDate: '2026-08-02' },
  { weekNumber: 2, startDate: '2026-08-03', endDate: '2026-08-09' },
  { weekNumber: 3, startDate: '2026-08-10', endDate: '2026-08-16' },
  { weekNumber: 4, startDate: '2026-08-17', endDate: '2026-08-23' },
  { weekNumber: 5, startDate: '2026-08-24', endDate: '2026-08-30' },
  { weekNumber: 6, startDate: '2026-08-31', endDate: '2026-08-31' }
])