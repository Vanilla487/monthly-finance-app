import Fastify from 'fastify'
import cors from '@fastify/cors'
import './migrate.js'

const fastify = Fastify({ logger: true })

await fastify.register(cors, {
  origin: 'http://localhost:5173'
})

fastify.get('/api/health', async (request, reply) => {
  return { status: 'bombaclaaaart' }
})

const start = async () => {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()

import { createTransaction, getTransactionsByStatement } from './transactions.js'
import { getAllStatements } from './statements.js'
import { getAllCategories } from './categories.js'

const [statement] = getAllStatements()
const [groceries] = getAllCategories()

createTransaction({
  statementId: statement.id,
  date: '2026-06-01',
  rawDescription: 'REWE SAGT DANKE 4829',
  displayName: 'Rewe',
  amount: 38.12,
  categoryId: groceries.id
})

createTransaction({
  statementId: statement.id,
  date: '2026-06-03',
  rawDescription: 'UNKNOWN MERCHANT XYZ',
  displayName: 'Unknown Merchant Xyz',
  amount: 12.4
  // no categoryId — stays uncategorized
})

console.log(getTransactionsByStatement(statement.id))