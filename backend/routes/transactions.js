import {
  getTransactionById,
  updateTransactionCategory,
  updateTransactionRefund,
  deleteTransaction
} from '../transactions.js'

export default async function transactionsRoutes(fastify) {
  fastify.patch('/api/transactions/:id', async (request, reply) => {
    const { id } = request.params
    const { categoryId, isRefund } = request.body ?? {}

    if (categoryId === undefined && isRefund === undefined) {
      return reply.code(400).send({
        error: 'categoryId (use null to uncategorize) or isRefund is required'
      })
    }

    const existing = getTransactionById(id)
    if (!existing) {
      return reply.code(404).send({ error: `No transaction found with id: ${id}` })
    }

    if (isRefund !== undefined) {
      if (typeof isRefund !== 'boolean') {
        return reply.code(400).send({ error: 'isRefund must be true or false' })
      }
      if (existing.direction !== 'in') {
        return reply.code(400).send({ error: 'Only incoming transactions can be marked as a refund' })
      }
      // A refund counts against spending, so it keeps (or later gets) a category;
      // un-marking returns it to plain income.
      const updated = updateTransactionRefund(id, isRefund)
      if (categoryId === undefined) return updated
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
