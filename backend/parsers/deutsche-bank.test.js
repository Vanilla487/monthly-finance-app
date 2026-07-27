import { readFileSync } from 'fs'
import { parse } from './deutsche-bank.js'
import { isValidParsedTransaction } from './types.js'

const fileContent = readFileSync('./sample-deutsche-bank.csv', 'utf-8')
const results = parse(fileContent)

console.log(`Parsed ${results.length} rows`)
console.log('First 5:', results.slice(0, 5))
console.log('All valid shape:', results.every(isValidParsedTransaction))

const outflows = results.filter((t) => t.isOutflow)
console.log(`Outflows: ${outflows.length}, Inflows: ${results.length - outflows.length}`)