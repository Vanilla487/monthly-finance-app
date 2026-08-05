import { useState, useEffect } from 'react'

function AddAccountModal({ onCancel, onCreated }) {
  const [bankTypes, setBankTypes] = useState([])
  const [bankType, setBankType] = useState('')
  const [customName, setCustomName] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('http://localhost:3000/api/bank-types')
      .then((res) => res.json())
      .then((data) => {
        setBankTypes(data)
        if (data.length > 0) setBankType(data[0].bankType)
      })
  }, [])

  async function handleSubmit() {
    if (!bankType || !customName.trim()) {
      setError('Pick a bank type and enter a name')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const response = await fetch('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bankType, customName })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create account')
      onCreated(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="upload-modal">
      <h2>Add an account</h2>

      <label htmlFor="bank-type-select">Bank</label>
      <select
        id="bank-type-select"
        value={bankType}
        onChange={(e) => setBankType(e.target.value)}
      >
        {bankTypes.map((bt) => (
          <option key={bt.bankType} value={bt.bankType}>{bt.label}</option>
        ))}
      </select>

      <label htmlFor="custom-name">Name</label>
      <input
        id="custom-name"
        type="text"
        value={customName}
        onChange={(e) => setCustomName(e.target.value)}
        placeholder="e.g. N26 (Personal)"
      />

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Saving…' : 'Create account'}
        </button>
      </div>
    </div>
  )
}

export default AddAccountModal