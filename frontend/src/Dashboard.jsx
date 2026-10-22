import { useState, useEffect } from 'react'
import n26Logo from './assets/N26_idQBiV8Ehj_0.svg'
import dbLogo from './assets/Deutsche_Bank_id8uM_LXr8_0.svg'
import apobankLogo from './assets/apobank.svg'

const BANK_LOGOS = { n26: n26Logo, db: dbLogo, apobank: apobankLogo }
const BANK_LABELS = { n26: 'N26', db: 'DB', apobank: 'apoBank' }

function formatMonthLabel(month) {
  const [year, monthNum] = month.split('-')
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return { monthName: months[parseInt(monthNum, 10) - 1], year }
}

function formatTotal(total) {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
    useGrouping: false
  }).format(total)
}

function CategoryBars({ breakdown, total }) {
  return (
    <div className="card-bars">
      {breakdown.map((cat) => {
        const rawPct = total > 0 ? cat.total / total : 0
        const width = `${Math.sqrt(rawPct) * 100}%`

        return (
          <div className="card-bar-row" key={cat.name}>
            <span className="card-bar-label">{cat.name}</span>
            <div className="card-bar-track">
              <div
                className="card-bar-fill"
                style={{
                  width,
                  background: `var(--cat-${cat.color})`
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyCategoryBars() {
  const EmptyCategoryBars = ['Groceries', 'Subscriptions', 'Savings', 'Eating Out', 'Discretionary', 'Travel']
  return (
    <div className="card-bars">
      {EmptyCategoryBars.map((categoryName) => (
            <div key={categoryName} className="card-bar-row">
            <span className="card-bar-label">{categoryName}</span>
            <div className="card-bar-track">
            </div>
          </div> 
      ))}
 
        </div>
  )
}

function Dashboard({ onUploadClick, onStatementClick, onAddAccountClick, onCategoriesClick }) {
  const [statements, setStatements] = useState([])
  const [loading, setLoading] = useState(true)
  const [accountFilter, setAccountFilter] = useState('all')

  useEffect(() => {
    fetch('http://localhost:3000/api/statements')
      .then((res) => res.json())
      .then((data) => {
        setStatements(data)
        setLoading(false)
      })
  }, [])

  // Accounts that have at least one statement, in name order.
  const accounts = Object.values(
    Object.fromEntries(statements.map((s) => [s.account_id, { id: s.account_id, name: s.custom_name }]))
  ).sort((a, b) => a.name.localeCompare(b.name))

  const visibleStatements =
    accountFilter === 'all' ? statements : statements.filter((s) => String(s.account_id) === accountFilter)

  return (
    <div>
      {accounts.length > 1 && (
        <div className="dashboard-filters">
          <select
            className="plain-select"
            aria-label="Filter by account"
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
          >
            <option value="all">All Accounts</option>
            {accounts.map((a) => (
              <option key={a.id} value={String(a.id)}>{a.name}</option>
            ))}
          </select>
          {accountFilter !== 'all' && (
            <button className="plain-button" onClick={() => setAccountFilter('all')}>Clear Filters</button>
          )}
        </div>
      )}
      <div className="statement-grid">
        <div className="statement-card" onClick={onUploadClick}>
          <div className='card-header'>
            <div className="card-total"><h2>€0</h2></div>
             <div className="card-icon">↑</div>
          </div>
           <span>
                  <strong className='card-month'>New</strong> 
                </span>
          <EmptyCategoryBars></EmptyCategoryBars>
         
          
        </div>

        {loading && <p>Loading…</p>}

        {visibleStatements.map((s) => {
          const { monthName, year } = formatMonthLabel(s.month)
          return (
            <div key={s.id} className="statement-card" onClick={() => onStatementClick(s.id)}>
              <div className="card-header">
                <div className="card-total"><h2>{formatTotal(s.total)}</h2></div>
                
                <span className={`bank-badge bank-${s.bank_type}`}>
  <img src={BANK_LOGOS[s.bank_type]} alt={BANK_LABELS[s.bank_type] || s.bank_type} className={`bank-logo bank-logo-${s.bank_type}`}/>
</span>
                
              </div>   
              <span>
                  <strong className='card-month'>{monthName}</strong> <span className="card-year">{year}</span>
                </span>
                
              
              <CategoryBars breakdown={s.categoryBreakdown} total={s.total} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard