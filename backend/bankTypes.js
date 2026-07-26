export const BANK_TYPES = ['n26', 'db', 'apo', ''] // extend as you add real parsers

export function isValidBankType(bankType) {
  return BANK_TYPES.includes(bankType)
}