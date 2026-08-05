import { getAllCategories } from '../categories.js'

export default async function categoriesRoutes(fastify) {
  fastify.get('/api/categories', async () => {
    return getAllCategories()
  })
}