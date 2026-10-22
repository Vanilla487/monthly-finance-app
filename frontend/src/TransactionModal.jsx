import { useState } from 'react'
import Modal from './Modal'

const euroFormat = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' })

// "2026-06-01" -> "Monday, 1 June 2026"
function formatLongDate(isoDate) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(Date.UTC(y, m - 1, d)))
}

function TransactionModal({ transaction, rule, accountName, onClose, onDeleted, onRefundChanged }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [savingRefund, setSavingRefund] = useState(false)
  const [error, setError] = useState(null)

  const isIncoming = transaction.direction === 'in'

  async function handleToggleRefund() {
    setSavingRefund(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRefund: !transaction.isRefund })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update refund')
      onRefundChanged?.(transaction.id, !!data.is_refund)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingRefund(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    try {
      const response = await fetch(`http://localhost:3000/api/transactions/${transaction.id}`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to delete transaction')
      }
      onDeleted(transaction.id)
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  let ruleText = 'Manually categorized'
  if (isIncoming && !transaction.isRefund) {
    ruleText = 'Money received — not counted as spending'
  } else if (transaction.ruleId) {
    ruleText = rule ? `Rule: description contains “${rule.substring}”` : 'Matched by a rule'
  } else if (!transaction.categoryId) {
    ruleText = 'Not categorized yet'
  }

  return (
    <Modal onClose={onClose} size="small">
      <div className="txn-modal">
        <div className="txn-modal-header">
          <div>
            <h3 className="txn-modal-name">{transaction.displayName}</h3>
            <p className="txn-modal-date">{formatLongDate(transaction.date)}</p>
          </div>
          <button className="icon-button" aria-label="Close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <p className={`txn-modal-amount ${isIncoming ? 'amount-in' : ''}`}>
          {isIncoming ? (transaction.isRefund ? '−' : '+') : ''}
          {euroFormat.format(transaction.amount)}
        </p>

        {isIncoming && (
          <div className="refund-toggle">
            <p>
              {transaction.isRefund
                ? 'Counted as a refund: it comes off this month’s spending, under its category.'
                : 'Counted as incoming money. If it’s money back for something she bought, mark it as a refund to take it off spending.'}
            </p>
            <button className="btn-secondary" onClick={handleToggleRefund} disabled={savingRefund}>
              {savingRefund ? 'Saving…' : transaction.isRefund ? 'Not a refund' : 'Mark as refund'}
            </button>
          </div>
        )}

        <dl className="txn-modal-details">
          {(!isIncoming || transaction.isRefund) && (
            <>
              <dt>Category</dt>
              <dd>
                <span className="dot" style={{ background: `var(--cat-${transaction.categoryColor || 'grey'})` }} />
                {transaction.categoryName || 'Uncategorized'}
              </dd>
            </>
          )}

          <dt>How</dt>
          <dd>{ruleText}</dd>

          {accountName && (
            <>
              <dt>Account</dt>
              <dd>{accountName}</dd>
            </>
          )}

          <dt>Bank description</dt>
          <dd className="txn-modal-raw">{transaction.rawDescription}</dd>
        </dl>

        {error && <p className="form-error">{error}</p>}

        <div className="txn-modal-actions">
          {confirming ? (
            <>
              <span className="txn-modal-confirm-text">Delete this transaction?</span>
              <button className="btn-secondary" onClick={() => setConfirming(false)} disabled={deleting}>
                Cancel
              </button>
              <button className="btn-danger-solid" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </>
          ) : (
            <button className="btn-danger" onClick={() => setConfirming(true)}>
              Delete transaction
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default TransactionModal
