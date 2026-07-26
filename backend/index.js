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

import { createRule, findMatchingRule } from './rules.js'
import { getAllCategories } from './categories.js'

const [groceries] = getAllCategories()
createRule({ substring: 'REWE', displayName: 'Rewe', categoryId: groceries.id })
console.log(findMatchingRule('REWE SAGT DANKE 4829 KARTENZAHLG'))
console.log(findMatchingRule('SPOTIFY'))