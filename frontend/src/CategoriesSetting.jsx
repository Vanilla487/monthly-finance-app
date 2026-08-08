import { useState, useEffect } from 'react'

function ColorSwatchPicker({ colors, selected, onSelect }) {
  return (
    <div className="swatch-group">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          className={`swatch${color === selected ? ' selected' : ''}`}
          style={{ '--swatch-color': `var(--cat-${color})` }}
          aria-label={color}
          aria-pressed={color === selected}
          onClick={() => onSelect(color)}
        />
      ))}
    </div>
  )
}

function CategoryRow({ category, colors, onSaved, onDeleted }) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function cancelEdit() {
    setName(category.name)
    setColor(category.color)
    setError(null)
    setEditing(false)
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/categories/${category.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update category')
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
      const response = await fetch(`http://localhost:3000/api/categories/${category.id}`, {
        method: 'DELETE'
      })
      if (response.status === 409) {
        const data = await response.json()
        setError(
          `Can't delete — still used by ${data.ruleCount} rule(s) and ${data.transactionCount} transaction(s). Reassign or remove those first.`
        )
        return
      }
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete category')
      }
      onDeleted(category.id)
    } catch (err) {
      setError(err.message)
    }
  }

  if (editing) {
    return (
      <div className="category-settings-row editing">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={saving}
        />
        <ColorSwatchPicker colors={colors} selected={color} onSelect={setColor} />
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
    <div className="category-settings-row">
      <span className="category-pill" style={{ '--pill-color': `var(--cat-${category.color})` }}>
        <span className="dot" />
        {category.name}
      </span>
      {error && <p className="form-error">{error}</p>}
      <div className="row-actions">
        <button className="btn-secondary" onClick={() => setEditing(true)}>Rename</button>
        <button className="btn-danger" onClick={handleDelete}>Delete</button>
      </div>
    </div>
  )
}

function NewCategoryForm({ colors, onCreated }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(colors[0])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handleCreate() {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3000/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create category')
      onCreated(data)
      setName('')
      setColor(colors[0])
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="new-category-form">
      <input
        type="text"
        placeholder="New category name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={saving}
      />
      <ColorSwatchPicker colors={colors} selected={color} onSelect={setColor} />
      <button className="btn-primary" onClick={handleCreate} disabled={saving}>
        {saving ? 'Adding…' : '+ Add category'}
      </button>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

function CategoriesSettings({ onBack }) {
  const [categories, setCategories] = useState([])
  const [colors, setColors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:3000/api/categories').then((res) => res.json()),
      fetch('http://localhost:3000/api/category-colors').then((res) => res.json())
    ]).then(([categoriesData, colorsData]) => {
      setCategories(categoriesData)
      setColors(colorsData)
      setLoading(false)
    })
  }, [])

  function handleCreated(category) {
    setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
  }

  function handleSaved(updated) {
    setCategories((prev) =>
      prev
        .map((c) => (c.id === updated.id ? updated : c))
        .sort((a, b) => a.name.localeCompare(b.name))
    )
  }

  function handleDeleted(id) {
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <div className="categories-settings">
      <div className="review-header">
        <h2>Categories</h2>
        <button className="btn-secondary" onClick={onBack}>Back</button>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && (
        <>
          <div className="category-settings-list">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                colors={colors}
                onSaved={handleSaved}
                onDeleted={handleDeleted}
              />
            ))}
          </div>

          <NewCategoryForm colors={colors} onCreated={handleCreated} />
        </>
      )}
    </div>
  )
}

export default CategoriesSettings