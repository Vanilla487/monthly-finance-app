import { readApoBankRecords, CARD_BOOKING } from './apobank.js'

// apoBank credit card export — the day-to-day card purchases. Same columns as the
// account export, but every row is a "Kreditkartenbuchung", Name is empty and
// everything is packed into Verwendungszweck:
//
//   0000 EUR RAND PHARMACY JO  SABAA JOD   2,35 KURS: 0,791246 1,75% AUSLANDSUMS. 0,05 Visa Hauptkarte
//   0000 EUR APPLE.COM/BILL IE  08006645451 EUR   9,99 Umsatz vom 06.10.2026 Visa Hauptkarte
//   0000 EUR Jahresbeitrag Umsatz vom 01.09.2026 Visa Hauptkarte
//   0000 EUR Abrechnung vom 07.10.2026 KARTENDOPPEL      <- positive: the account paying off the card
//
// Betrag is already in EUR including the foreign-currency fee, so it's used as is.
// Dates are booking dates (the "Umsatz vom" purchase date is only given for some rows),
// which matches the card's running balance and puts every purchase in exactly one month.
// Rows outside the statement month are dropped, so the card export must cover the whole
// calendar month (a wider range is fine) — the upload modal says so.

const PREFIX = /^\d{4}\s+EUR\s+/
// Merchant text ends where the original currency + amount start: "... JOD   2,35"
const MERCHANT_BEFORE_AMOUNT = /^(.*?)\s+[A-Z]{3}\s+[\d.]+,\d{2}(?:\s|$)/
const PURCHASE_DATE_SUFFIX = /\s+Umsatz vom .*$/

export function describeCardBooking(reference) {
  const text = reference.replace(PREFIX, '')
  const merchant = text.match(MERCHANT_BEFORE_AMOUNT)?.[1] ?? text.replace(PURCHASE_DATE_SUFFIX, '')
  return merchant.replace(/\s+/g, ' ').trim() || reference
}

export function parse(fileContent) {
  const records = readApoBankRecords(fileContent)

  if (records.some((r) => r.orderType !== CARD_BOOKING)) {
    throw new Error(
      "This doesn't look like the apoBank credit card export (it has account bookings in it) — upload the account statement as the first file"
    )
  }

  return records.map((r) => {
    const isPayment = r.amount > 0 && /\bAbrechnung\b/.test(r.reference)
    return {
      date: r.date,
      rawDescription: describeCardBooking(r.reference),
      amount: Math.abs(r.amount),
      isOutflow: r.amount < 0,
      // The account paying off the card: not spending, never counted
      isCardSettlement: isPayment
    }
  })
}
