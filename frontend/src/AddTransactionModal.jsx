import { useState } from 'react'
import Modal from './Modal'

// Last day of a "YYYY-MM" month, as "YYYY-MM-DD"
function lastDayOf(month) {
  const [y, m] = month.split('-').map(Number)
  const day = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return `${month}-${String(day).padStart(2, '0')}`
}

// Accepts "1.234,56", "1234,56" or "1234.56"
function parseAmount(text) {
  const cleaned = text.trim().replace(/\s|€/g, '')
  const normalized = cleaned.includes(',') ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned
  return Number(normalized)
}

function AddTransactionModal({ statementId, month, categories, onClose, onAdded }) {
  const [direction, setDirection] = useState('out')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(`${month}-01`)
  const [categoryId, setCategoryId] = useState('')
  const [countsAgainstSpending, setCountsAgainstSpending] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const showCategory = direction === 'out' || countsAgainstSpending

  async function handleSubmit(e) {
    e.preventDefault()
    const parsedAmount = parseAmount(amount)
    if (!name.trim()) return setError('Enter a name')
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Enter an amount above zero')
    if (!date.startsWith(month)) return setError('Pick a date in this statement’s month')

    setSaving(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3000/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statementId,
          date,
          name: name.trim(),
          amount: parsedAmount,
          direction,
          isRefund: direction === 'in' && countsAgainstSpending,
          categoryId: showCategory && categoryId ? Number(categoryId) : null
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Couldn’t add the transaction')
      onAdded(data)
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} size="small">
      <form className="add-txn-form" onSubmit={handleSubmit}>
        <h3>Add transaction</h3>

        <div className="view-switch" role="radiogroup" aria-label="Money in or out">
          <button type="button" role="radio" aria-checked={direction === 'out'} className={direction === 'out' ? 'active' : ''} onClick={() => setDirection('out')}>
            Outgoing
          </button>
          <button type="button" role="radio" aria-checked={direction === 'in'} className={direction === 'in' ? 'active' : ''} onClick={() => setDirection('in')}>
            Incoming
          </button>
        </div>

        <label>
          Name
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={direction === 'in' ? 'Rent and bills from Lewis' : 'Bakery'} autoFocus />
        </label>

        <div className="add-txn-row">
          <label>
            Amount (€)
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </label>
          <label>
            Date
            <input type="date" value={date} min={`${month}-01`} max={lastDayOf(month)} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>

        {direction === 'in' && (
          <label className="add-txn-check">
            <input type="checkbox" checked={countsAgainstSpending} onChange={(e) => setCountsAgainstSpending(e.target.checked)} />
            <span>
              Take it off spending
              <small>For a refund or someone paying back their share. Otherwise it counts as incoming money.</small>
            </span>
          </label>
        )}

        {showCategory && (
          <label>
            Category
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="txn-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding…' : 'Add transaction'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default AddTransactionModal
