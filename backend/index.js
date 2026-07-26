import Fastify from 'fastify'
import cors from '@fastify/cors'

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