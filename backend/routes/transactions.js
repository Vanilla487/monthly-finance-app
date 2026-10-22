import { getStatementById } from '../statements.js'
import {
  createTransaction,
  getTransactionById,
  updateTransactionCategory,
  updateTransactionRefund,
  deleteTransaction
} from '../transactions.js'

export default async function transactionsRoutes(fastify) {
  // Add a transaction by hand, e.g. a payment the bank file didn't include.
  fastify.post('/api/transactions', async (request, reply) => {
    const { statementId, date, name, amount, direction, categoryId = null, isRefund = false } =
      request.body ?? {}

    const statement = statementId ? getStatementById(statementId) : null
    if (!statement) {
      return reply.code(404).send({ error: `No statement found with id: ${statementId}` })
    }
    if (typeof name !== 'string' || !name.trim()) {
      return reply.code(400).send({ error: 'Enter a name' })
    }
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return reply.code(400).send({ error: 'Enter an amount above zero' })
    }
    if (direction !== 'in' && direction !== 'out') {
      return reply.code(400).send({ error: "direction must be 'in' or 'out'" })
    }
    const isRealDate =
      typeof date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      !Number.isNaN(Date.parse(date)) &&
      new Date(date).toISOString().slice(0, 10) === date
    if (!isRealDate || !date.startsWith(statement.month)) {
      return reply.code(400).send({ error: `Pick a date in this statement's month (${statement.month})` })
    }
    if (isRefund && direction !== 'in') {
      return reply.code(400).send({ error: 'Only incoming transactions can be a refund' })
    }

    try {
      const created = createTransaction({
        statementId: statement.id,
        date,
        rawDescription: name.trim(),
        displayName: name.trim(),
        amount: Math.round(amount * 100) / 100,
        direction,
        isRefund: !!isRefund,
        isManual: true,
        // Plain income has no category; spending and refunds can have one
        categoryId: direction === 'in' && !isRefund ? null : categoryId
      })
      return reply.code(201).send(created)
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(400).send({ error: `No category found with id: ${categoryId}` })
      }
      return reply.code(400).send({ error: err.message })
    }
  })

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
