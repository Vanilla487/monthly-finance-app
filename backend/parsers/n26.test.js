import { readFileSync } from 'fs'
import { parse } from './n26.js'
import { isValidParsedTransaction } from './types.js'

// --- Test 1: real file parses correctly ---
const fileContent = readFileSync('./sample-n26.csv', 'utf-8')
const results = parse(fileContent)

console.log(`Parsed ${results.length} rows`)
console.log('First 3:', results.slice(0, 3))
console.log('All valid shape:', results.every(isValidParsedTransaction))

const outflows = results.filter((t) => t.isOutflow)
console.log(`Outflows: ${outflows.length}, Inflows: ${results.length - outflows.length}`)

// --- Test 2: wrong-format file throws a clear error ---
try {
  parse('some,random,columns\n1,2,3')
  console.log('ERROR: expected this to throw, but it did not')
} catch (err) {
  console.log('Caught expected error:', err.message)
}