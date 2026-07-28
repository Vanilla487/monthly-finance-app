import { parse as parseN26 } from './n26.js'
import { parse as parseDeutscheBank } from './deutsche-bank.js'

const PARSERS = {
  n26: parseN26,
  db: parseDeutscheBank
}

export function getParserForBankType(bankType) {
  const parser = PARSERS[bankType]
  if (!parser) {
    throw new Error(`No parser implemented for bank type: '${bankType}'`)
  }
  return parser
}