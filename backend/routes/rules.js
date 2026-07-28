import { createRule } from '../rules.js'

export default async function rulesRoutes(fastify) {
  fastify.post('/api/rules', async (request, reply) => {
    const { substring, displayName, categoryId } = request.body

    if (!substring || !displayName || !categoryId) {
      return reply.code(400).send({
        error: 'substring, displayName, and categoryId are all required'
      })
    }

    try {
      const rule = createRule({ substring, displayName, categoryId })
      return reply.code(201).send(rule)
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(400).send({
          error: `No category found with id: ${categoryId}`
        })
      }
      return reply.code(400).send({ error: err.message })
    }
  })
}