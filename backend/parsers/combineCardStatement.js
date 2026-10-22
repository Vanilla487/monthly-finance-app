// Merge an account statement with the credit card statement for the same account.
//
// Banks without a debit card (apoBank) settle the card as one lump-sum payment from
// the account a month later. When the card's own export is imported alongside, we:
//   - drop those settlement rows from the account statement (otherwise every card
//     purchase would be counted twice, a month apart), and
//   - add the card's individual purchases,
// so the statement reads as one continuous stream of spending, as if a debit card
// had been used.
export function combineWithCardStatement(accountTransactions, cardTransactions) {
  const accountWithoutSettlements = accountTransactions.filter((txn) => !txn.isCardSettlement)
  const cardPurchases = cardTransactions.filter((txn) => !txn.isCardSettlement)
  return [...accountWithoutSettlements, ...cardPurchases].sort((a, b) =>
    b.date.localeCompare(a.date)
  )
}
