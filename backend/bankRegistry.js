import { parse as parseN26 } from './parsers/n26.js'
import { parse as parseDeutscheBank } from './parsers/deutsche-bank.js'
import { parse as parseApoBank } from './parsers/apobank.js'

export const BANK_REGISTRY = {
  n26: {
    label: 'N26',
    iconAsset: 'n26', // no real image assets yet — maps to a CSS badge class for now
    parserModule: parseN26
  },
  db: {
    label: 'Deutsche Bank',
    iconAsset: 'db',
    parserModule: parseDeutscheBank
  },
  apobank: {
    label: 'apoBank',
    iconAsset: 'apobank',
    parserModule: parseApoBank
  }
}

export function isValidBankType(bankType) {
  return Object.prototype.hasOwnProperty.call(BANK_REGISTRY, bankType)
}

export function getParserForBankType(bankType) {
  const entry = BANK_REGISTRY[bankType]
  if (!entry) {
    throw new Error(`No parser implemented for bank type: '${bankType}'`)
  }
  return entry.parserModule
}

export function getBankLabel(bankType) {
  return BANK_REGISTRY[bankType]?.label ?? bankType
}

export function listBankTypes() {
  return Object.entries(BANK_REGISTRY).map(([bankType, entry]) => ({
    bankType,
    label: entry.label,
    iconAsset: entry.iconAsset
  }))
}