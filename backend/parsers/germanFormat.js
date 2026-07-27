export function parseGermanAmount(str) {
  // "1.234,56" -> 1234.56 ; "-8,9" -> -8.9
  const normalized = str.replace(/\./g, '').replace(',', '.')
  return parseFloat(normalized)
}

export function parseGermanDate(str) {
  // "30.6.2026" -> "2026-06-30"
  const [day, month, year] = str.split('.')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}