import { useState, useEffect, useMemo } from 'react'

function formatAmount(amount) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount)
}

function Donut({ categoryTotals, hoveredCategoryId, onHover }) {
  const size = 200
  const radius = 80
  const strokeWidth = 28
  const circumference = 2 * Math.PI * radius
  const center = size / 2

  let offsetSoFar = 0

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {categoryTotals.map((cat) => {
        const fraction = cat.percentage / 100
        const dash = fraction * circumference
        const segment = (
          <circle
            key={cat.categoryId ?? 'uncategorized'}
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={`var(--cat-${cat.color})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offsetSoFar}
            opacity={
              hoveredCategoryId === null || hoveredCategoryId === (cat.categoryId ?? 'uncategorized')
                ? 1
                : 0.3
            }
            transform={`rotate(-90 ${center} ${center})`}
            onMouseEnter={() => onHover(cat.categoryId ?? 'uncategorized')}
            onMouseLeave={() => onHover(null)}
            style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
          />
        )
        offsetSoFar += dash
        return segment
      })}
    </svg>
  )
}

function Legend({ categoryTotals, hoveredCategoryId, onHover }) {
  return (
    <div className="legend">
      {categoryTotals.map((cat) => {
        const key = cat.categoryId ?? 'uncategorized'
        return (
          <div
            key={key}
            className="legend-row"
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            style={{ opacity: hoveredCategoryId === null || hoveredCategoryId === key ? 1 : 0.4 }}
          >
            <span className="legend-dot" style={{ background: `var(--cat-${cat.color})` }} />
            <span className="legend-name">{cat.name}</span>
            <span className="legend-percentage">{cat.percentage.toFixed(0)}%</span>
            <span className="legend-total">{formatAmount(cat.total)}</span>
          </div>
        )
      })}
    </div>
  )
}

const DEFAULT_FILTERS = {
  categoryId: 'all',
  sortDirection: 'none',
  minAmount: '',
  maxAmount: ''
}

function Toolbar({ categoryTotals, filters, onChange, onClear }) {
  return (
    <div className="toolbar">
      <select
        value={filters.categoryId}
        onChange={(e) => onChange({ ...filters, categoryId: e.target.value })}
      >
        <option value="all">All categories</option>
        {categoryTotals.map((cat) => (
          <option key={cat.categoryId ?? 'uncategorized'} value={cat.categoryId ?? 'uncategorized'}>
            {cat.name}
          </option>
        ))}
      </select>

      <select
        value={filters.sortDirection}
        onChange={(e) => onChange({ ...filters, sortDirection: e.target.value })}
      >
        <option value="none">Sort by amount</option>
        <option value="desc">Amount: high to low</option>
        <option value="asc">Amount: low to high</option>
      </select>

      <input
        type="number"
        placeholder="Min €"
        value={filters.minAmount}
        onChange={(e) => onChange({ ...filters, minAmount: e.target.value })}
      />
      <input
        type="number"
        placeholder="Max €"
        value={filters.maxAmount}
        onChange={(e) => onChange({ ...filters, maxAmount: e.target.value })}
      />

      <button className="btn-secondary" onClick={onClear}>Clear filters</button>
    </div>
  )
}

function WeekSelector({ weeks, selectedWeek, onSelect }) {
  return (
    <div className="week-selector">
      <button
        className={selectedWeek === null ? 'week-btn selected' : 'week-btn'}
        onClick={() => onSelect(null)}
      >
        Full month
      </button>
      {weeks.map((w) => (
        <button
          key={w.weekNumber}
          className={selectedWeek === w.weekNumber ? 'week-btn selected' : 'week-btn'}
          onClick={() => onSelect(w.weekNumber)}
        >
          Week {w.weekNumber}
        </button>
      ))}
    </div>
  )
}

function RuleTag({ ruleId }) {
  if (!ruleId) return null
  return (
    <span className="rule-tag" title={`Matched automatically by rule #${ruleId}`}>
      rule
    </span>
  )
}

function EditableCategoryPill({ transaction, categories, onCategoryChanged }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  async function handlePick(categoryId) {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to update category')
      onCategoryChanged(transaction.id, data)
      setOpen(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (open) {
    return (
      <div className="pill-edit-wrapper">
        <div className="pill-group">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="category-pill"
              style={{ '--pill-color': `var(--cat-${cat.color})` }}
              disabled={saving}
              onClick={() => handlePick(cat.id)}
            >
              <span className="dot" />
              {cat.name}
            </button>
          ))}
          <button className="btn-secondary" onClick={() => setOpen(false)} disabled={saving}>Cancel</button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    )
  }

  return (
    <button
      className="category-pill selected"
      style={{ '--pill-color': `var(--cat-${transaction.categoryColor || 'grey'})` }}
      onClick={() => setOpen(true)}
    >
      <span className="dot" />
      {transaction.categoryName || 'Uncategorized'}
    </button>
  )
}

function StatementDetail({ statementId, onBack }) {
  const [detail, setDetail] = useState(null)
  const [categories, setCategories] = useState([])
  const [hoveredCategoryId, setHoveredCategoryId] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:3000/api/statements/${statementId}`)
      .then((res) => res.json())
      .then(setDetail)
    fetch('http://localhost:3000/api/categories')
      .then((res) => res.json())
      .then(setCategories)
  }, [statementId])

  function handleCategoryChanged(transactionId, updated) {
    const category = categories.find((c) => c.id === updated.category_id)
    setDetail((prev) => ({
      ...prev,
      transactions: prev.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              categoryId: updated.category_id,
              categoryName: category?.name ?? null,
              categoryColor: category?.color ?? null
            }
          : t
      )
    }))
  }

  async function handleDeleteStatement() {
    if (!window.confirm('Delete this statement and all its transactions? This cannot be undone.')) {
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/statements/${statementId}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete statement')
      }
      onBack()
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
  }

  const weekScopedTransactions = useMemo(() => {
    if (!detail) return []
    if (selectedWeek === null) return detail.transactions

    const week = detail.weeks.find((w) => w.weekNumber === selectedWeek)
    if (!week) return detail.transactions

    return detail.transactions.filter((t) => t.date >= week.startDate && t.date <= week.endDate)
  }, [detail, selectedWeek])

  const weekScopedCategoryTotals = useMemo(() => {
    const totalsByCategory = {}
    for (const t of weekScopedTransactions) {
      const key = t.categoryId ?? 'uncategorized'
      if (!totalsByCategory[key]) {
        totalsByCategory[key] = {
          categoryId: t.categoryId ?? null,
          name: t.categoryName ?? 'Uncategorized',
          color: t.categoryColor ?? 'grey',
          total: 0
        }
      }
      totalsByCategory[key].total += t.amount
    }
    const scopedTotal = weekScopedTransactions.reduce((sum, t) => sum + t.amount, 0)
    return Object.values(totalsByCategory).map((c) => ({
      ...c,
      percentage: scopedTotal > 0 ? (c.total / scopedTotal) * 100 : 0
    }))
  }, [weekScopedTransactions])

  const visibleTransactions = useMemo(() => {
    let result = [...weekScopedTransactions]

    if (filters.categoryId !== 'all') {
      result = result.filter((t) => String(t.categoryId ?? 'uncategorized') === filters.categoryId)
    }
    if (filters.minAmount !== '') {
      result = result.filter((t) => t.amount >= Number(filters.minAmount))
    }
    if (filters.maxAmount !== '') {
      result = result.filter((t) => t.amount <= Number(filters.maxAmount))
    }
    if (filters.sortDirection === 'asc') {
      result.sort((a, b) => a.amount - b.amount)
    } else if (filters.sortDirection === 'desc') {
      result.sort((a, b) => b.amount - a.amount)
    }

    return result
  }, [weekScopedTransactions, filters])

  if (!detail) return <p>Loading…</p>

  const scopedTotal = weekScopedTransactions.reduce((sum, t) => sum + t.amount, 0)

  return (
    <div className="statement-detail">
      <div className="detail-header-row">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn-danger" onClick={handleDeleteStatement} disabled={deleting}>
          {deleting ? 'Deleting…' : 'Delete statement'}
        </button>
      </div>
      {deleteError && <p className="form-error">{deleteError}</p>}
      <div className='statement-detail-main'>
      <div className='statement-title'>
      <h2>{detail.statement.customName} — {detail.statement.month}</h2>
      <p className="detail-total">{formatAmount(scopedTotal)}</p>
      </div>
      

      <div className="detail-chart-row">
        <Donut
          categoryTotals={weekScopedCategoryTotals}
          hoveredCategoryId={hoveredCategoryId}
          onHover={setHoveredCategoryId}
        />
        <Legend
          categoryTotals={weekScopedCategoryTotals}
          hoveredCategoryId={hoveredCategoryId}
          onHover={setHoveredCategoryId}
        />
      </div>
      </div>

<div className='filter-wrapper'>
  <WeekSelector weeks={detail.weeks} selectedWeek={selectedWeek} onSelect={setSelectedWeek} />
  <Toolbar
        categoryTotals={weekScopedCategoryTotals}
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />
</div>

      

      <div className="transaction-list">
        {visibleTransactions.map((t) => (
          <div className="transaction-row" key={t.id}>
            <span>{t.date}</span>
            <span>
              <strong>{t.displayName}</strong>
              <RuleTag ruleId={t.ruleId} />
            </span>
            <span>{formatAmount(t.amount)}</span>
            <EditableCategoryPill
              transaction={t}
              categories={categories}
              onCategoryChanged={handleCategoryChanged}
            />
          </div>
        ))}
        {visibleTransactions.length === 0 && <p>No transactions match these filters.</p>}
      </div>
    </div>
  )
}

export default StatementDetail