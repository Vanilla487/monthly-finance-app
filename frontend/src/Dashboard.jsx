import { useState, useEffect } from 'react'

const BANK_LABELS = { n26: 'N26', db: 'DB' }

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return { monthName: months[parseInt(monthNum, 10) - 1], year }
}

function formatTotal(total) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(total)
}

function CategoryBars({ breakdown, total }) {
  return (
    <div className="card-bars">
      {breakdown.map((cat) => (
        <div className="card-bar-row" key={cat.name}>
          <span className="card-bar-label">{cat.name}</span>
          <div className="card-bar-track">
            <div
              className="card-bar-fill"
              style={{
                width: total > 0 ? `${(cat.total / total) * 100}%` : '0%',
                background: `var(--cat-${cat.color})`
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function Dashboard({ onUploadClick, onStatementClick, onAddAccountClick, onCategoriesClick }) {
  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('http://localhost:3000/api/statements')
      .then((res) => res.json())
      .then((data) => {
        setStatements(data)
        setLoading(false)
      })
  }, [])

  return (
    <div>
<div className="dashboard-toolbar">
        <button className="btn-secondary" onClick={onCategoriesClick}>Categories</button>
        <button className="btn-secondary" onClick={onAddAccountClick}>+ Add account</button>
      </div>

      <div className="statement-grid">
        <div className="statement-card upload-card" onClick={onUploadClick}>
          <div className="card-icon">↑</div>
          <div className="card-total">€0</div>
        </div>

        {loading && <p>Loading…</p>}

        {statements.map((s) => {
          const { monthName, year } = formatMonthLabel(s.month)
          return (
            <div key={s.id} className="statement-card" onClick={() => onStatementClick(s.id)}>
              <div className="card-header">
                <span>
                  <strong>{monthName}</strong> <span className="card-year">{year}</span>
                </span>
                <span className={`bank-badge bank-${s.bank_type}`}>
                  {BANK_LABELS[s.bank_type] || s.bank_type.toUpperCase()}
                </span>
              </div>
              <div className="card-total">{formatTotal(s.total)}</div>
              <CategoryBars breakdown={s.categoryBreakdown} total={s.total} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard