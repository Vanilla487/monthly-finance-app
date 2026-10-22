import { useState, useRef, useEffect } from 'react'

// Bank exports are either UTF-8 or Windows-1252 (e.g. some apoBank exports).
// file.text() always assumes UTF-8 and would mangle umlauts in the latter.
async function readCsvText(file) {
  const bytes = await file.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

function UploadModal({ onCancel, onPreviewReady }) {
  const [accounts, setAccounts] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [staged, setStaged] = useState(null) // { fileName, preview }
  const fileInputRef = useRef(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data)
        if (data.length > 0) setSelectedAccountId(String(data[0].id))
      })
  }, [])

  async function handleFile(file) {
    if (!selectedAccountId) {
      setError('Pick an account first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const csvContent = await readCsvText(file)
      const response = await fetch('http://localhost:3000/api/statements/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: Number(selectedAccountId), csvContent })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to build preview')
      setStaged({ fileName: file.name, preview: data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleChooseDifferent() {
    setStaged(null)
    setError(null)
  }

  function handleSubmit() {
    onPreviewReady(staged.preview)
  }

  return (
    <div className="upload-modal">
      <h2>Upload a statement</h2>

      <label htmlFor="account-select">Account</label>
      <select
        id="account-select"
        value={selectedAccountId}
        onChange={(e) => setSelectedAccountId(e.target.value)}
        disabled={!!staged}
      >
        {accounts.length === 0 && <option value="">No accounts yet</option>}
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.custom_name} ({acc.bank_type})
          </option>
        ))}
      </select>

      {staged ? (
        <div className="staged-file">
          <p><strong>{staged.fileName}</strong></p>
          <p>{staged.preview.transactions.length} transactions found</p>
        </div>
      ) : (
        <div
          className={`dropzone ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleFileSelect} />
          <div>↑</div>
          <p>{loading ? 'Parsing…' : 'Drop your bank CSV here'}</p>
          <p>or click to browse · .csv from N26 or Deutsche Bank</p>
        </div>
      )}

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={staged ? handleChooseDifferent : onCancel}>
          {staged ? 'Choose different file' : 'Cancel'}
        </button>
        {staged && (
          <button className="btn-primary" onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  )
}

export default UploadModal