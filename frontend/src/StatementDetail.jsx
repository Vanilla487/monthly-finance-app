import { useState, useEffect, useMemo, useRef } from 'react'
import n26Logo from './assets/N26_idQBiV8Ehj_0.svg'
import dbLogo from './assets/Deutsche_Bank_id8uM_LXr8_0.svg'
import apobankLogo from './assets/apobank.svg'
import TransactionModal from './TransactionModal'

const BANK_LOGOS = { n26: n26Logo, db: dbLogo, apobank: apobankLogo }
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })
const euroWholeFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

// "22,83 €"
function formatAmount(amount) {
  return euroFormat.format(amount)
}

// "2.283 €" — for the large headline numbers
function formatWholeAmount(amount) {
  return euroWholeFormat.format(Math.round(amount))
}

// "2026-06-01" -> "Mon 1"
function formatDay(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]
  return `${weekday} ${d}`
}

// "2026-06-01", "2026-06-07" -> "1–7 Jun"
function formatRange(startDate, endDate) {
  const [, m, d1] = startDate.split('-').map(Number)
  const d2 = Number(endDate.split('-')[2])
  const mon = MONTHS[m - 1].slice(0, 3)
  return d1 === d2 ? `${d1} ${mon}` : `${d1}–${d2} ${mon}`
}

const keyOf = (categoryId) => categoryId ?? 'uncategorized'

function Donut({ categoryTotals, total, hoveredKey, onHover }) {
  const size = 240
  const strokeWidth = 30
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const hovered = categoryTotals.find((c) => keyOf(c.categoryId) === hoveredKey)

  const offsets = categoryTotals.reduce(
    (acc, cat) => [...acc, acc[acc.length - 1] + (cat.percentage / 100) * circumference],
    [0]
  )

  return (
    <div className="donut">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {categoryTotals.length === 0 && (
          <circle cx={center} cy={center} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        )}
        {categoryTotals.map((cat, i) => {
          const key = keyOf(cat.categoryId)
          const dash = (cat.percentage / 100) * circumference
          return (
            <circle
              key={key}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={`var(--cat-${cat.color})`}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offsets[i]}
              opacity={hoveredKey === null || hoveredKey === key ? 1 : 0.25}
              transform={`rotate(-90 ${center} ${center})`}
              onMouseEnter={() => onHover(key)}
              onMouseLeave={() => onHover(null)}
            />
          )
        })}
      </svg>
      <div className="donut-center">
        <span className={hovered ? 'donut-center-value donut-center-value--category' : 'donut-center-value'}>
          {hovered ? formatAmount(hovered.total) : formatWholeAmount(total)}
        </span>
        {/* Absolutely positioned so the total doesn't shift when this appears. */}
        <span className={hovered ? 'donut-center-hint visible' : 'donut-center-hint'} aria-live="polite">
          {hovered && (
            <>
              <span className="dot" style={{ background: `var(--cat-${hovered.color})` }} />
              {hovered.name}
            </>
          )}
        </span>
      </div>
    </div>
  )
}

function DonutLegend({ categoryTotals, hoveredKey, onHover }) {
  return (
    <ul className="donut-legend">
      {categoryTotals.map((cat) => {
        const key = keyOf(cat.categoryId)
        return (
          <li
            key={key}
            className={hoveredKey !== null && hoveredKey !== key ? 'dimmed' : ''}
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
            title={cat.name}
          >
            <span className="dot" style={{ background: `var(--cat-${cat.color})` }} />
            {cat.percentage.toFixed(0)}%
          </li>
        )
      })}
    </ul>
  )
}

function CategoryBars({ categoryTotals, hoveredKey, onHover }) {
  return (
    <div className="detail-bars">
      {categoryTotals.map((cat) => {
        const key = keyOf(cat.categoryId)
        return (
          <div
            key={key}
            className={hoveredKey !== null && hoveredKey !== key ? 'detail-bar-row dimmed' : 'detail-bar-row'}
            onMouseEnter={() => onHover(key)}
            onMouseLeave={() => onHover(null)}
          >
            <span className="detail-bar-name">{cat.name}</span>
            <span className="detail-bar-track">
              <span
                className="detail-bar-fill"
                style={{ width: `${Math.sqrt(cat.percentage / 100) * 100}%`, background: `var(--cat-${cat.color})` }}
              />
            </span>
            <span className="detail-bar-amount">{formatAmount(cat.total)}</span>
          </div>
        )
      })}
    </div>
  )
}

function WeekTabs({ weeks, selectedWeek, onSelect }) {
  return (
    <div className="week-tabs" role="tablist">
      <button
        role="tab"
        aria-selected={selectedWeek === null}
        className={selectedWeek === null ? 'week-tab selected' : 'week-tab'}
        onClick={() => onSelect(null)}
      >
        Show All
      </button>
      {weeks.map((w) => (
        <button
          key={w.weekNumber}
          role="tab"
          aria-selected={selectedWeek === w.weekNumber}
          className={selectedWeek === w.weekNumber ? 'week-tab selected' : 'week-tab'}
          title={formatRange(w.startDate, w.endDate)}
          onClick={() => onSelect(w.weekNumber)}
        >
          Week {w.weekNumber}
        </button>
      ))}
    </div>
  )
}

function CategoryFilter({ categoryTotals, value, onChange }) {
  return (
    <div className="list-filters">
      <select
        className="plain-select"
        aria-label="Filter by category"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="all">All Categories</option>
        {categoryTotals.map((cat) => (
          <option key={keyOf(cat.categoryId)} value={String(keyOf(cat.categoryId))}>
            {cat.name}
          </option>
        ))}
      </select>
      {value !== 'all' && (
        <button className="plain-button" onClick={() => onChange('all')}>Clear Filters</button>
      )}
    </div>
  )
}

function RuleIcon({ ruleId, rule }) {
  if (!ruleId) return null
  return (
    <span className="rule-icon" tabIndex={0} aria-label="Categorized by a rule">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
      <span className="rule-tooltip" role="tooltip">
        {rule ? (
          <>
            <span className="rule-tooltip-title">Categorized by rule</span>
            Description contains <strong>“{rule.substring}”</strong>
          </>
        ) : (
          <span className="rule-tooltip-title">Categorized by a rule</span>
        )}
      </span>
    </span>
  )
}

function CategoryPicker({ transaction, categories, onCategoryChanged }) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

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

  return (
    <span className="category-picker" ref={ref}>
      <button
        className="txn-category"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Change category"
      >
        <span className="dot" style={{ background: `var(--cat-${transaction.categoryColor || 'grey'})` }} />
        {transaction.categoryName || 'Uncategorized'}
      </button>
      {open && (
        <div className="category-menu" role="menu">
          {categories.map((cat) => (
            <button
              key={cat.id}
              role="menuitem"
              className={cat.id === transaction.categoryId ? 'category-menu-item current' : 'category-menu-item'}
              disabled={saving}
              onClick={() => handlePick(cat.id)}
            >
              <span className="dot" style={{ background: `var(--cat-${cat.color})` }} />
              {cat.name}
            </button>
          ))}
          {error && <p className="form-error">{error}</p>}
        </div>
      )}
    </span>
  )
}

function OverflowMenu({ onDelete, deleting }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function close(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  return (
    <div className="overflow-menu" ref={ref}>
      <button className="icon-button" aria-label="More actions" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" />
        </svg>
      </button>
      {open && (
        <div className="category-menu overflow-menu-list" role="menu">
          <button
            role="menuitem"
            className="category-menu-item danger"
            disabled={deleting}
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
          >
            {deleting ? 'Deleting…' : 'Delete statement'}
          </button>
        </div>
      )}
    </div>
  )
}

function StatementDetail({ statementId, onBack }) {
  const [detail, setDetail] = useState(null)
  const [categories, setCategories] = useState([])
  const [rulesById, setRulesById] = useState({})
  const [hoveredKey, setHoveredKey] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [openTransactionId, setOpenTransactionId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)

  useEffect(() => {
    fetch(`http://localhost:3000/api/statements/${statementId}`)
      .then((res) => res.json())
      .then(setDetail)
    fetch('http://localhost:3000/api/categories')
      .then((res) => res.json())
      .then(setCategories)
    fetch('http://localhost:3000/api/rules')
      .then((res) => res.json())
      .then((rules) => setRulesById(Object.fromEntries(rules.map((r) => [r.id, r]))))
      .catch(() => {})
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

  function handleTransactionDeleted(transactionId) {
    setDetail((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== transactionId)
    }))
    setOpenTransactionId(null)
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

  // Only weeks that contain at least one transaction get a tab.
  const nonEmptyWeeks = useMemo(() => {
    if (!detail) return []
    return detail.weeks.filter((w) =>
      detail.transactions.some((t) => t.date >= w.startDate && t.date <= w.endDate)
    )
  }, [detail])

  // If the selected week becomes empty (e.g. its last transaction was deleted), fall back to Show All.
  const activeWeek = nonEmptyWeeks.some((w) => w.weekNumber === selectedWeek) ? selectedWeek : null

  const weekScopedTransactions = useMemo(() => {
    if (!detail) return []
    if (activeWeek === null) return detail.transactions

    const week = detail.weeks.find((w) => w.weekNumber === activeWeek)
    if (!week) return detail.transactions

    return detail.transactions.filter((t) => t.date >= week.startDate && t.date <= week.endDate)
  }, [detail, activeWeek])

  const scopedTotal = useMemo(
    () => weekScopedTransactions.reduce((sum, t) => sum + t.amount, 0),
    [weekScopedTransactions]
  )

  // Per-category totals for the current week scope, largest first.
  const categoryTotals = useMemo(() => {
    const byCategory = {}
    for (const t of weekScopedTransactions) {
      const key = keyOf(t.categoryId)
      if (!byCategory[key]) {
        byCategory[key] = {
          categoryId: t.categoryId ?? null,
          name: t.categoryName ?? 'Uncategorized',
          color: t.categoryColor ?? 'grey',
          total: 0
        }
      }
      byCategory[key].total += t.amount
    }
    return Object.values(byCategory)
      .map((c) => ({ ...c, percentage: scopedTotal > 0 ? (c.total / scopedTotal) * 100 : 0 }))
      .sort((a, b) => b.total - a.total)
  }, [weekScopedTransactions, scopedTotal])

  const visibleTransactions = useMemo(() => {
    if (categoryFilter === 'all') return weekScopedTransactions
    return weekScopedTransactions.filter((t) => String(keyOf(t.categoryId)) === categoryFilter)
  }, [weekScopedTransactions, categoryFilter])

  const uncategorizedCount = weekScopedTransactions.filter((t) => t.categoryId == null).length

  if (!detail) return <p>Loading…</p>

  const openTransaction = detail.transactions.find((t) => t.id === openTransactionId)

  const [year, monthNum] = detail.statement.month.split('-')
  const monthName = MONTHS[Number(monthNum) - 1]
  const bankType = detail.statement.bankType

  return (
    <div className="statement-detail">
      <div className="detail-topbar">
        <button className="back-link" onClick={onBack}>&lt; back to statements</button>
        <OverflowMenu onDelete={handleDeleteStatement} deleting={deleting} />
      </div>
      {deleteError && <p className="form-error">{deleteError}</p>}

      <div className="detail-summary">
        <div className="detail-summary-left">
          <div className="detail-heading">
            {BANK_LOGOS[bankType] && (
              <span className={`bank-badge detail-bank-badge bank-${bankType}`} title={detail.statement.customName}>
                <img src={BANK_LOGOS[bankType]} alt={detail.statement.customName} className={`bank-logo bank-logo-${bankType}`} />
              </span>
            )}
            <h2 className="detail-month">{monthName}</h2>
            <span className="detail-year">{year}</span>
          </div>
          <CategoryBars categoryTotals={categoryTotals} hoveredKey={hoveredKey} onHover={setHoveredKey} />
          {uncategorizedCount > 0 && categoryFilter !== 'uncategorized' && (
            <button className="uncategorized-hint" onClick={() => setCategoryFilter('uncategorized')}>
              {uncategorizedCount} uncategorized {uncategorizedCount === 1 ? 'transaction' : 'transactions'} · Review
            </button>
          )}
        </div>

        <div className="detail-summary-right">
          <Donut categoryTotals={categoryTotals} total={scopedTotal} hoveredKey={hoveredKey} onHover={setHoveredKey} />
          <DonutLegend categoryTotals={categoryTotals} hoveredKey={hoveredKey} onHover={setHoveredKey} />
        </div>
      </div>

      <div className="list-controls">
        <WeekTabs weeks={nonEmptyWeeks} selectedWeek={activeWeek} onSelect={setSelectedWeek} />
        <CategoryFilter categoryTotals={categoryTotals} value={categoryFilter} onChange={setCategoryFilter} />
      </div>

      <div className="txn-list">
        {visibleTransactions.map((t) => (
          <div
            className="txn-row"
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => setOpenTransactionId(t.id)}
            onKeyDown={(e) => {
              if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                setOpenTransactionId(t.id)
              }
            }}
          >
            <span className="txn-date">{formatDay(t.date)}</span>
            <span className="txn-name" title={t.rawDescription}>{t.displayName}</span>
            {/* Category picker and rule tooltip have their own interactions; don't open the modal. */}
            <span className="txn-meta" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
              <CategoryPicker transaction={t} categories={categories} onCategoryChanged={handleCategoryChanged} />
              <RuleIcon ruleId={t.ruleId} rule={rulesById[t.ruleId]} />
            </span>
            <span className="txn-amount">{formatAmount(t.amount)}</span>
          </div>
        ))}
        {visibleTransactions.length === 0 && <p className="txn-empty">No transactions match these filters.</p>}
      </div>

      {openTransaction && (
        <TransactionModal
          transaction={openTransaction}
          rule={rulesById[openTransaction.ruleId]}
          accountName={detail.statement.customName}
          onClose={() => setOpenTransactionId(null)}
          onDeleted={handleTransactionDeleted}
        />
      )}
    </div>
  )
}

export default StatementDetail
