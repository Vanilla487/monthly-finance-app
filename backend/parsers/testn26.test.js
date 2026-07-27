import { readFileSync } from 'fs'
import { parse } from './n26.js'
import { isValidParsedTransaction } from './types.js'

const fileContent = readFileSync('./sample-n26.csv', 'utf-8')
const results = parse(fileContent)

console.log(`Parsed ${results.length} rows`)
console.log('First 3:', results.slice(0, 3))
console.log('All valid shape:', results.every(isValidParsedTransaction))

const outflows = results.filter((t) => t.isOutflow)
console.log(`Outflows: ${outflows.length}, Inflows: ${results.length - outflows.length}`)