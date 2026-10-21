import { getTransactionById, updateTransactionCategory, deleteTransaction } from '../transactions.js'

export default async function transactionsRoutes(fastify) {
  fastify.patch('/api/transactions/:id', async (request, reply) => {
    const { id } = request.params
    const { categoryId } = request.body ?? {}

    if (categoryId === undefined) {
      return reply.code(400).send({ error: 'categoryId is required (use null to uncategorize)' })
    }

    const existing = getTransactionById(id)
    if (!existing) {
      return reply.code(404).send({ error: `No transaction found with id: ${id}` })
    }

    try {
      // TXN-1: this only ever touches transactions.category_id. It never
      // writes to rule_id, so a manual re-category here does not retroactively
      // link (or unlink) any rule — rule_id keeps recording whichever rule,
      // if any, originally matched this row at import time.
      const updated = updateTransactionCategory(id, categoryId)
      return updated
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(400).send({ error: `No category found with id: ${categoryId}` })
      }
      return reply.code(400).send({ error: err.message })
    }
  })

  // Removes a single transaction. Rules and the parent statement are untouched;
  // statement totals are computed from transactions, so they update automatically.
  fastify.delete('/api/transactions/:id', async (request, reply) => {
    const { id } = request.params
    if (!deleteTransaction(id)) {
      return reply.code(404).send({ error: `No transaction found with id: ${id}` })
    }
    return reply.code(204).send()
  })
}
