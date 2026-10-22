import { useState, useEffect } from 'react'

function suggestSubstring(rawDescription) {
  const tokens = rawDescription.split(/\s+/)
  const allCapsToken = tokens.find(
    (t) => t.length >= 2 && t === t.toUpperCase() && /[A-Z]/.test(t)
  )
  return allCapsToken || tokens[0] || rawDescription
}

function CategoryPills({ categories, selected, onSelect }) {
  if (selected) {
    return (
      <button
        className="category-pill selected"
        style={{ '--pill-color': `var(--cat-${selected.color})` }}
        onClick={() => onSelect(null)}
      >
        <span className="dot" />
        {selected.name}
      </button>
    )
  }

  return (
    <div className="pill-group">
      {categories.map((cat) => (
        <button
          key={cat.id}
          className="category-pill"
          style={{ '--pill-color': `var(--cat-${cat.color})` }}
          onClick={() => onSelect(cat)}
        >
          <span className="dot" />
          {cat.name}
        </button>
      ))}
    </div>
  )
}

function InlineRuleForm({ rawDescription, categories, defaultCategoryId, onSave, onCancel }) {
  const [substring, setSubstring] = useState(suggestSubstring(rawDescription))
  const [displayName, setDisplayName] = useState(rawDescription)
  const [categoryId, setCategoryId] = useState(defaultCategoryId)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3000/api/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substring, displayName, categoryId: Number(categoryId) })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save rule')
      onSave(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="inline-rule-form">
      <label>
        Substring
        <input value={substring} onChange={(e) => setSubstring(e.target.value)} />
      </label>
      <label>
        Display name
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>
      <label>
        Category
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </label>
      {error && <p style={{ color: '#dc2626' }}>{error}</p>}
      <div className="rule-form-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save rule'}
        </button>
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  const [, month, day] = dateStr.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`
}

function formatAmount(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

async function commitStatement(payload, confirmReplace = false) {
  const response = await fetch('http://localhost:3000/api/statements', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, confirmReplace })
  })

  if (response.status === 409) {
    const shouldReplace = window.confirm(
      'A statement already exists for this account and month. Replace it?'
    )
    if (shouldReplace) return commitStatement(payload, true)
    return null
  }

  const data = await response.json()
  if (!response.ok) {
    alert(`Error: ${data.error}`)
    return null
  }
  return data
}

function CategorizeReview({ preview, onCancel, onCommitted }) {
  const [categories, setCategories] = useState([])
  const [transactions, setTransactions] = useState(preview.transactions)
  const [openRuleFormIndex, setOpenRuleFormIndex] = useState(null)
  const [savedRuleIndexes, setSavedRuleIndexes] = useState(new Set())

  useEffect(() => {
    fetch('http://localhost:3000/api/categories')
      .then((res) => res.json())
      .then(setCategories)
  }, [])

  function handleSelect(index, category) {
    setTransactions((prev) =>
      prev.map((txn, i) =>
        i === index
          ? {
              ...txn,
              categoryId: category?.id ?? null,
              categoryName: category?.name ?? null,
              categoryColor: category?.color ?? null
            }
          : txn
      )
    )
  }

  // Applies a newly-saved rule to the row that created it, plus any other
  // currently-unmatched rows whose raw description contains the rule's substring.
  // This only touches the in-memory review list — nothing already persisted
  // in the database is affected, so it doesn't conflict with RULES-3's
  // "no retroactive effect on existing transactions" guarantee.
  function applyRuleToTransactions(rule, originIndex) {
    const category = categories.find((c) => c.id === rule.category_id)
    setTransactions((prev) =>
      prev.map((txn, i) => {
        const isOrigin = i === originIndex
        const matches = txn.rawDescription.toUpperCase().includes(rule.substring.toUpperCase())
        if (isOrigin || (!txn.categoryId && matches)) {
          return {
            ...txn,
            categoryId: rule.category_id,
            categoryName: category?.name ?? null,
            categoryColor: category?.color ?? null,
            ruleId: rule.id
          }
        }
        return txn
      })
    )
  }

  function handleRuleSaved(index, rule) {
    applyRuleToTransactions(rule, index)
    setOpenRuleFormIndex(null)
    setSavedRuleIndexes((prev) => new Set(prev).add(index))
  }

  const needsCategoryCount = transactions.filter((t) => t.direction !== 'in' && !t.categoryId).length
  const incoming = transactions.filter((t) => t.direction === 'in')

  async function handleCreateStatement() {
    const payload = {
      accountId: preview.accountId,
      month: preview.month,
      transactions: transactions.map((t) => ({
        date: t.date,
        rawDescription: t.rawDescription,
        amount: t.amount,
        direction: t.direction,
        categoryId: t.categoryId,
        ruleId: t.ruleId
      }))
    }

    const result = await commitStatement(payload)
    if (result) {
      alert(`Statement created with ${transactions.length} transactions.`)
      onCommitted()
    }
  }

  return (
    <div className="review-screen">
      <div className="review-header">
        <div>
          <h2>Categorize transactions</h2>
          <p>Monthly recognized most of your CSV — pick a category for the rest.</p>
        </div>
        <span className="needs-category-count">{needsCategoryCount} need a category</span>
      </div>

      <div className="transaction-list">
        {transactions.map((txn, index) => {
          if (txn.direction === 'in') return null
          const selected = txn.categoryId
            ? { id: txn.categoryId, name: txn.categoryName, color: txn.categoryColor }
            : null

          return (
            <div key={`${txn.date}-${txn.rawDescription}-${index}`}>
              <div className="transaction-row">
                <span>{formatDate(txn.date)}</span>
                <span><strong>{txn.rawDescription}</strong></span>
                <span>{formatAmount(txn.amount)}</span>
                <div>
                  <CategoryPills
                    categories={categories}
                    selected={selected}
                    onSelect={(cat) => handleSelect(index, cat)}
                  />
                  {selected && savedRuleIndexes.has(index) && (
                    <p className="rule-saved-badge">✓ Rule saved</p>
                  )}
                  {selected && !savedRuleIndexes.has(index) && openRuleFormIndex !== index && (
                    <button
                      className="save-as-rule-link"
                      onClick={() => setOpenRuleFormIndex(index)}
                    >
                      + Save as rule
                    </button>
                  )}
                </div>
              </div>

              {openRuleFormIndex === index && (
                <InlineRuleForm
                  rawDescription={txn.rawDescription}
                  categories={categories}
                  defaultCategoryId={txn.categoryId}
                  onSave={(rule) => handleRuleSaved(index, rule)}
                  onCancel={() => setOpenRuleFormIndex(null)}
                />
              )}
            </div>
          )
        })}
      </div>

      {incoming.length > 0 && (
        <div className="review-incoming">
          <h3>Incoming</h3>
          <p>Money received this month. No category needed — if one is a refund, mark it on the statement afterwards and it'll come off spending.</p>
          <div className="transaction-list">
            {incoming.map((txn, index) => (
              <div className="transaction-row" key={`in-${txn.date}-${txn.rawDescription}-${index}`}>
                <span>{formatDate(txn.date)}</span>
                <span><strong>{txn.rawDescription}</strong></span>
                <span className="amount-in">+{formatAmount(txn.amount)}</span>
                <div />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" onClick={handleCreateStatement}>Create statement</button>
      </div>
    </div>
  )
}

export default CategorizeReview