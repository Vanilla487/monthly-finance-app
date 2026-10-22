// apoBank credit card export (the day-to-day card purchases).
//
// TODO(MON-50): the column layout isn't known yet — needs a real sample export
// (anonymised) as backend/parsers/sample-apobank-card.csv. Until then this throws a
// clear error so the upload flow can be built and tested around it.
export function parse() {
  throw new Error(
    "apoBank credit card import isn't supported yet — a sample card export is needed to finish it"
  )
}
