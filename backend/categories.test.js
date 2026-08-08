import db from './db.js'
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from './categories.js'
import { createRule, deleteRule } from './rules.js'

function check(label, actual, expected) {
  const pass = actual === expected
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}` + (pass ? '' : ` (expected ${expected}, got ${actual})`))
}

const createdCategoryIds = []
const createdRuleIds = []

function makeTestCategory(name, color) {
  const category = createCategory({ name, color })
  createdCategoryIds.push(category.id)
  return category
}

try {
  let rejected = false
  try {
    createCategory({ name: 'ZZTEST_Bad', color: '#ff00ff' })
  } catch (err) {
    rejected = true
  }
  check('creating a category with a non-preset color throws', rejected, true)

  const cat = makeTestCategory('ZZTEST_Category', 'teal')
  check('creating a category with a preset color succeeds', cat.color, 'teal')

  let updateRejected = false
  try {
    updateCategory(cat.id, { name: 'ZZTEST_Category', color: 'not-a-real-color' })
  } catch (err) {
    updateRejected = true
  }
  check('updating a category with a non-preset color throws', updateRejected, true)

  const updated = updateCategory(cat.id, { name: 'ZZTEST_Renamed', color: 'pink' })
  check('updating a category with a valid color and name succeeds', updated.name, 'ZZTEST_Renamed')

  const unused = makeTestCategory('ZZTEST_Unused', 'grey')
  deleteCategory(unused.id)
  check('deleting an unused category removes it', getCategoryById(unused.id), undefined)
  createdCategoryIds.splice(createdCategoryIds.indexOf(unused.id), 1)

  const inUseCategory = makeTestCategory('ZZTEST_InUse', 'orange')
  const rule = createRule({
    substring: 'ZZTEST_SOME_MERCHANT',
    displayName: 'ZZTEST merchant',
    categoryId: inUseCategory.id
  })
  createdRuleIds.push(rule.id)

  let fkRejected = false
  try {
    deleteCategory(inUseCategory.id)
  } catch (err) {
    fkRejected = true
  }
  check('deleting a category still referenced by a rule is rejected by the FK constraint', fkRejected, true)
} finally {
  createdRuleIds.forEach(deleteRule)
  createdCategoryIds.forEach((id) => {
    if (getCategoryById(id)) deleteCategory(id)
  })
  console.log(`Cleaned up ${createdRuleIds.length} test rule(s) and ${createdCategoryIds.length} test category id(s)`)
}