import db from './db.js'
import { getStatementById, deleteStatement } from './statements.js'
import { deleteTransactionsByStatement } from './transactions.js'

// TXN-2: deletes a statement and only its own transactions. Rules are
// never touched here — deleting a statement has no effect on the rules
// table by construction (nothing in this function references rules).
export function deleteStatementCascade(statementId) {
  const statement = getStatementById(statementId)
  if (!statement) {
    const err = new Error(`No statement found with id: ${statementId}`)
    err.statusCode = 404
    throw err
  }

  const remove = db.transaction(() => {
    deleteTransactionsByStatement(statementId)
    deleteStatement(statementId)
  })
  remove()
}