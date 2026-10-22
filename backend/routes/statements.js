import { buildStatementPreview } from '../statementImport.js'
import { commitStatement } from '../statementCommit.js'
import { findStatementByAccountAndMonth, getAllStatements } from '../statements.js'
import { buildStatementDetail } from '../statementDetail.js'
import { deleteStatementCascade } from '../statementDelete.js'

export default async function statementsRoutes(fastify) {
  fastify.post('/api/statements/preview', async (request, reply) => {
    const { accountId, month, csvContent, cardCsvContent } = request.body

    if (!accountId || !csvContent) {
      return reply.code(400).send({
        error: 'accountId and csvContent are required'
      })
    }

    try {
      const preview = buildStatementPreview({ accountId, month, csvContent, cardCsvContent })
      return preview
    } catch (err) {
      const statusCode = err.statusCode ?? 400
      return reply.code(statusCode).send({ error: err.message })
    }
  })

  fastify.post('/api/statements', async (request, reply) => {
    const { accountId, month, transactions, confirmReplace } = request.body

    if (!accountId || !month || !Array.isArray(transactions)) {
      return reply.code(400).send({
        error: 'accountId, month, and transactions array are required'
      })
    }

    const existing = findStatementByAccountAndMonth(accountId, month)
    if (existing && !confirmReplace) {
      return reply.code(409).send({
        error: 'A statement already exists for this account and month',
        requiresConfirmation: true
      })
    }

    const result = commitStatement({ accountId, month, transactions })
    return reply.code(201).send(result)
  })

  fastify.get('/api/statements', async () => {
    return getAllStatements()
  })

  fastify.get('/api/statements/:id', async (request, reply) => {
    try {
      return buildStatementDetail(request.params.id)
    } catch (err) {
      const statusCode = err.statusCode ?? 400
      return reply.code(statusCode).send({ error: err.message })
    }
  })

  fastify.delete('/api/statements/:id', async (request, reply) => {
    try {
      deleteStatementCascade(request.params.id)
      return reply.code(204).send()
    } catch (err) {
      const statusCode = err.statusCode ?? 400
      return reply.code(statusCode).send({ error: err.message })
    }
  })
}
  



  
