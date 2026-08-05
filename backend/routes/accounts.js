import { getAllAccounts, createAccount } from '../accounts.js'
import { listBankTypes, getBankLabel } from '../bankRegistry.js'

export default async function accountsRoutes(fastify) {
  fastify.get('/api/accounts', async () => {
    const accounts = getAllAccounts()
    return accounts.map((a) => ({
      ...a,
      bankLabel: getBankLabel(a.bank_type)
    }))
  })

  fastify.get('/api/bank-types', async () => {
    return listBankTypes()
  })

  fastify.post('/api/accounts', async (request, reply) => {
    const { bankType, customName } = request.body

    if (!bankType || !customName) {
      return reply.code(400).send({
        error: 'bankType and customName are required'
      })
    }

    try {
      const account = createAccount({ bankType, customName })
      return reply.code(201).send(account)
    } catch (err) {
      return reply.code(400).send({ error: err.message })
    }
  })
}