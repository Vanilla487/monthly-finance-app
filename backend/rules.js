import db from './db.js'

export function createRule({ substring, displayName, categoryId }) {
  const stmt = db.prepare(
    'INSERT INTO rules (substring, display_name, category_id) VALUES (?, ?, ?)'
  )
  const result = stmt.run(substring, displayName, categoryId)
  return getRuleById(result.lastInsertRowid)
}

export function getRuleById(id) {
  return db.prepare('SELECT * FROM rules WHERE id = ?').get(id)
}

export function getAllRules() {
  return db
    .prepare(
      `SELECT rules.*, categories.name AS category_name, categories.color AS category_color
       FROM rules
       JOIN categories ON categories.id = rules.category_id
       ORDER BY rules.created_at DESC`
    )
    .all()
}

export function updateRule(id, { substring, displayName, categoryId }) {
  db.prepare(
    'UPDATE rules SET substring = ?, display_name = ?, category_id = ? WHERE id = ?'
  ).run(substring, displayName, categoryId, id)
  return getRuleById(id)
}

export function deleteRule(id) {
  db.prepare('DELETE FROM rules WHERE id = ?').run(id)
}

export function findMatchingRule(rawDescription) {
  const rules = getAllRules()
  const upperDescription = rawDescription.toUpperCase()

  const matches = rules.filter((rule) =>
    upperDescription.includes(rule.substring.toUpperCase())
  )

  if (matches.length === 0) return null

  // longest substring wins on ties (most specific match)
  matches.sort((a, b) => b.substring.length - a.substring.length)
  return matches[0]
}