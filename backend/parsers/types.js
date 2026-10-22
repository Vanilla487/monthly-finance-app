/**
 * A bank parser is a function with this shape:
 *
 *   parse(fileContent: string) => Array<{
 *     date: string,            // ISO format, e.g. "2026-06-01"
 *     rawDescription: string,  // untouched, exactly as it appeared in the CSV
 *     amount: number,          // always positive (unsigned)
 *     isOutflow: boolean,      // true = money leaving the account (expense)
 *     isCardSettlement?: boolean // optional: lump-sum credit card bill payment, dropped
 *                               // when the card's own export is imported alongside
 *     isInternalTransfer?: boolean // optional: money moved between the user's own
 *                               // pots in the same file (e.g. N26 Spaces); never counted
 *   }>
 *
 * Parsers are responsible for their own delimiter/decimal/encoding handling,
 * and should return EVERY row (both outflows and inflows) with `isOutflow`
 * set correctly — filtering out inflows happens one level up, not inside
 * the parser itself. This keeps parsers simple and testable: "did you read
 * this row correctly" is a separate question from "should this row be kept."
 */

export function isValidParsedTransaction(txn) {
  return (
    typeof txn.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(txn.date) &&
    typeof txn.rawDescription === 'string' &&
    txn.rawDescription.length > 0 &&
    typeof txn.amount === 'number' &&
    txn.amount >= 0 &&
    typeof txn.isOutflow === 'boolean'
  )
}