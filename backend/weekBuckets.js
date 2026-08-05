export function getWeekBuckets(year, month) {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const buckets = []

  function weekdayOf(day) {
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0=Sun..6=Sat
  }

  let firstMonday = 1
  while (weekdayOf(firstMonday) !== 1) {
    firstMonday++
  }

  if (firstMonday > 1) {
    buckets.push({ start: 1, end: firstMonday - 1 })
  }

  let weekStart = firstMonday
  while (weekStart <= daysInMonth) {
    const weekEnd = Math.min(weekStart + 6, daysInMonth)
    buckets.push({ start: weekStart, end: weekEnd })
    weekStart += 7
  }

  return buckets.map((b, i) => ({
    weekNumber: i + 1,
    startDate: formatDate(year, month, b.start),
    endDate: formatDate(year, month, b.end)
  }))
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}