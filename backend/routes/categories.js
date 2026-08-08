import db from '../db.js'
import {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
} from '../categories.js'
import { CATEGORY_COLORS } from '../categoryColors.js'

export default async function categoriesRoutes(fastify) {
  fastify.get('/api/categories', async () => {
    return getAllCategories()
  })

  fastify.get('/api/category-colors', async () => {
    return CATEGORY_COLORS
  })

  fastify.post('/api/categories', async (request, reply) => {
    const { name, color } = request.body ?? {}

    if (!name || !color) {
      return reply.code(400).send({ error: 'name and color are required' })
    }

    try {
      const category = createCategory({ name, color })
      return reply.code(201).send(category)
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })

  fastify.patch('/api/categories/:id', async (request, reply) => {
    const { id } = request.params
    const { name, color } = request.body ?? {}

    if (!name || !color) {
      return reply.code(400).send({ error: 'name and color are required' })
    }

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!existing) {
      return reply.code(404).send({ error: `No category found with id: ${id}` })
    }

    try {
      const updated = updateCategory(id, { name, color })
      return updated
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })

  fastify.delete('/api/categories/:id', async (request, reply) => {
    const { id } = request.params

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
    if (!existing) {
      return reply.code(404).send({ error: `No category found with id: ${id}` })
    }

    // Deletion policy (also covers CATEGORIES-2's AC): block deletion if the
    // category is still referenced by a rule or transaction, rather than
    // cascading to null. rules.category_id is NOT NULL, so cascade-to-null
    // isn't even possible there without a schema change, and silently
    // orphaning a transaction's category felt like the wrong default for
    // financial data. Enforced explicitly here (for a clean error message)
    // and backstopped by the existing FK constraint either way.
    const ruleCount = db
      .prepare('SELECT COUNT(*) AS count FROM rules WHERE category_id = ?')
      .get(id).count
    const transactionCount = db
      .prepare('SELECT COUNT(*) AS count FROM transactions WHERE category_id = ?')
      .get(id).count

    if (ruleCount > 0 || transactionCount > 0) {
      return reply.code(409).send({
        error: 'Category is still in use and cannot be deleted',
        ruleCount,
        transactionCount
      })
    }

    deleteCategory(id)
    return reply.code(204).send()
  })
}