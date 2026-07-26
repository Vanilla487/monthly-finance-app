import db from './db.js'
import { isValidColor } from './categoryColors.js'

export function createCategory({ name, color }) {
  if (!isValidColor(color)) {
    throw new Error(`Invalid color: ${color}`)
  }
  const stmt = db.prepare('INSERT INTO categories (name, color) VALUES (?, ?)')
  const result = stmt.run(name, color)
  return getCategoryById(result.lastInsertRowid)
}

export function getCategoryById(id) {
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
}

export function getAllCategories() {
  return db.prepare('SELECT * FROM categories ORDER BY name ASC').all()
}

export function updateCategory(id, { name, color }) {
  if (color && !isValidColor(color)) {
    throw new Error(`Invalid color: ${color}`)
  }
  db.prepare('UPDATE categories SET name = ?, color = ? WHERE id = ?').run(
    name,
    color,
    id
  )
  return getCategoryById(id)
}

export function deleteCategory(id) {
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
}