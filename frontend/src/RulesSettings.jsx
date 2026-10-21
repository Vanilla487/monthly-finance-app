import { useState, useEffect } from 'react'

function RuleRow({ rule, categories, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [substring, setSubstring] = useState(rule.substring)
  const [displayName, setDisplayName] = useState(rule.display_name)
  const [categoryId, setCategoryId] = useState(rule.category_id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function cancelEdit() {
    setSubstring(rule.substring)
    setDisplayName(rule.display_name)
    setCategoryId(rule.category_id)
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (!substring.trim() || !displayName.trim()) {
      setError('Substring and display name are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/rules/${rule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substring: substring.trim(),
          displayName: displayName.trim(),
          categoryId: Number(categoryId)
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update rule')
      onSaved(data)
      setEditing(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/rules/${rule.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete rule')
      }
      onDeleted(rule.id)
    } catch (err) {
      setError(err.message)
    }
  }

  if (editing) {
    return (
      <div className="rule-settings-row editing">
        <input
          type="text"
          value={substring}
          onChange={(e) => setSubstring(e.target.value)}
          disabled={saving}
          placeholder="Substring to match"
        />
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          disabled={saving}
          placeholder="Display name"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          disabled={saving}
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
        {error && <p className="form-error">{error}</p>}
        <div className="row-actions">
          <button className="btn-secondary" onClick={cancelEdit} disabled={saving}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="rule-settings-row">
      <span className="rule-substring">{rule.substring}</span>
      <span className="rule-display-name">{rule.display_name}</span>
      <span
        className="category-pill selected"
        style={{ '--pill-color': `var(--cat-${rule.category_color})` }}
      >
        <span className="dot" />
        {rule.category_name}
      </span>
      {error && <p className="form-error">{error}</p>}
      <div className="row-actions">
        <button className="btn-secondary" onClick={() => setEditing(true)}>Edit</button>
        <button className="btn-danger" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  )
}

function RulesSettings({ onBack }) {
  const [rules, setRules] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/rules').then((res) => res.json()),
      fetch('http://localhost:3000/api/categories').then((res) => res.json())
    ]).then(([rulesData, categoriesData]) => {
      setRules(rulesData)
      setCategories(categoriesData)
      setLoading(false)
    })
  }, [])

  function handleSaved(updated) {
    const category = categories.find((c) => c.id === updated.category_id)
    setRules((prev) =>
      prev.map((r) =>
        r.id === updated.id
          ? {
              ...updated,
              category_name: category?.name,
              category_color: category?.color
            }
          : r
      )
    )
  }

  function handleDeleted(id) {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  return (
    <div className="rules-settings">
      <div className="review-header">
        <h2>Rules</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>

      <p className="rules-settings-note">
        Editing or deleting a rule only affects future imports — it never changes
        transactions that were already categorized.
      </p>

      {loading && <p>Loading…</p>}

      {!loading && rules.length === 0 && (
        <p>No rules yet. Rules are created from the review screen during a statement upload.</p>
      )}

      {!loading && rules.length > 0 && (
        <div className="rule-settings-list">
          {rules.map((rule) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              categories={categories}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default RulesSettings