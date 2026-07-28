import { createRule, deleteRule, findMatchingRule } from './rules.js'

// findMatchingRule reads from the real rules table (not a pure function),
// so this test creates real rows, checks behavior, then deletes them again.
// Test substrings are prefixed to make accidental collision with real rules
// in the dev DB extremely unlikely.

const GROCERIES_CATEGORY_ID = 1 // seeded 'Groceries' category

const createdIds = []

function makeTestRule(substring, displayName) {
  const rule = createRule({
    substring,
    displayName,
    categoryId: GROCERIES_CATEGORY_ID
  })
  createdIds.push(rule.id)
  return rule
}

function check(label, actual, expected) {
  const pass = actual === expected
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${label}` + (pass ? '' : ` (expected ${expected}, got ${actual})`))
}

try {
  // --- Test 1: no match ---
  makeTestRule('ZZTEST_NETFLIX', 'Netflix')
  const noMatch = findMatchingRule('ZZTEST_SOME_UNRELATED_MERCHANT_XYZ')
  check('no match returns null', noMatch, null)

  // --- Test 2: single match ---
  const singleMatchResult = findMatchingRule('ZZTEST_NETFLIX.COM BILLING 07/26')
  check('single match returns the matching rule', singleMatchResult?.substring, 'ZZTEST_NETFLIX')

  // --- Test 3: multiple overlapping matches, longest substring wins ---
  makeTestRule('ZZTEST_REWE', 'Rewe')
  makeTestRule('ZZTEST_REWE MARKT', 'Rewe Markt')
  const overlapResult = findMatchingRule('ZZTEST_REWE MARKT BERLIN MITTE')
  check('overlapping matches: longest substring wins', overlapResult?.substring, 'ZZTEST_REWE MARKT')

  // Sanity check the shorter one still matches on its own when the longer substring isn't present
  const shortOnlyResult = findMatchingRule('ZZTEST_REWE FILIALE 123')
  check('shorter rule still matches when longer one is absent', shortOnlyResult?.substring, 'ZZTEST_REWE')
} finally {
  // cleanup so this doesn't leave test data in the dev database
  createdIds.forEach(deleteRule)
  console.log(`Cleaned up ${createdIds.length} test rule(s)`)
}