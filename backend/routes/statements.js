import { buildStatementPreview } from '../statementImport.js'

export default async function statementsRoutes(fastify) {
  fastify.post('/api/statements/preview', async (request, reply) => {
    const { accountId, month, csvContent } = request.body

    if (!accountId || !month || !csvContent) {
      return reply.code(400).send({
        error: 'accountId, month, and csvContent are all required'
      })
    }

    try {
      const preview = buildStatementPreview({ accountId, month, csvContent })
      return preview
    } catch (err) {
      const statusCode = err.statusCode ?? 400
      return reply.code(statusCode).send({ error: err.message })
    }
  })
}