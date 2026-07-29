import { createRule, getAllRules, updateRule, deleteRule } from '../rules.js'

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

  fastify.get('/api/rules', async (request, reply) => {
    return getAllRules()
  })

  fastify.patch('/api/rules/:id', async (request, reply) => {
    const { id } = request.params
    const { substring, displayName, categoryId } = request.body

    if (!substring || !displayName || !categoryId) {
      return reply.code(400).send({
        error: 'substring, displayName, and categoryId are all required'
      })
    }

    try {
      const updated = updateRule(id, { substring, displayName, categoryId })
      if (!updated) {
        return reply.code(404).send({ error: `No rule found with id: ${id}` })
      }
      return updated
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
        return reply.code(400).send({
          error: `No category found with id: ${categoryId}`
        })
      }
      return reply.code(400).send({ error: err.message })
    }
  })

  fastify.delete('/api/rules/:id', async (request, reply) => {
    const { id } = request.params
    deleteRule(id)
    return reply.code(204).send()
  })
}