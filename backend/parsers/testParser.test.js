import { parse } from './testParser.js'
import { isValidParsedTransaction } from './types.js'

const sample = `2026-06-01,REWE,38.12,out
2026-06-02,SALARY,2000.00,in`

const results = parse(sample)

console.log('Parsed:', results)

const allValid = results.every(isValidParsedTransaction)
console.log('All valid shape:', allValid)

const outflowCount = results.filter((t) => t.isOutflow).length
console.log('Outflow count (expect 1):', outflowCount)