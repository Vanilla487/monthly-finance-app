export function filterToMonth(transactions, yearMonth) {
  // yearMonth format: "2026-06"
  return transactions.filter((txn) => txn.date.startsWith(yearMonth))
}