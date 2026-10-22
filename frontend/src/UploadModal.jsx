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

function Dropzone({ label, hint, file, loading, onFile }) {
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef(null)

  function handleDrop(e) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) onFile(dropped)
  }

  return (
    <div
      className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0]
          if (picked) onFile(picked)
          e.target.value = ''
        }}
      />
      <div>{file ? '✓' : '↑'}</div>
      <p>{loading ? 'Parsing…' : file ? file.name : label}</p>
      <p>{file ? 'Click to choose a different file' : hint}</p>
    </div>
  )
}

function UploadModal({ onCancel, onPreviewReady }) {
  const [accounts, setAccounts] = useState([])
  const [bankTypes, setBankTypes] = useState([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [usesCreditCard, setUsesCreditCard] = useState(false)
  const [accountFile, setAccountFile] = useState(null)
  const [cardFile, setCardFile] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [staged, setStaged] = useState(null) // { fileNames, preview }

  useEffect(() => {
    fetch('http://localhost:3000/api/accounts')
      .then((res) => res.json())
      .then((data) => {
        setAccounts(data)
        if (data.length > 0) setSelectedAccountId(String(data[0].id))
      })
    fetch('http://localhost:3000/api/bank-types')
      .then((res) => res.json())
      .then(setBankTypes)
  }, [])

  const selectedAccount = accounts.find((acc) => String(acc.id) === selectedAccountId)
  const supportsCardStatement = !!bankTypes.find(
    (bt) => bt.bankType === selectedAccount?.bank_type
  )?.supportsCardStatement
  const needsCardFile = supportsCardStatement && usesCreditCard

  async function buildPreview(nextAccountFile, nextCardFile) {
    if (!selectedAccountId) {
      setError('Pick an account first')
      return
    }
    // Wait until every file the flow needs is in
    if (!nextAccountFile || (needsCardFile && !nextCardFile)) return

    setLoading(true)
    setError(null)
    try {
      const csvContent = await readCsvText(nextAccountFile)
      const cardCsvContent = needsCardFile ? await readCsvText(nextCardFile) : undefined
      const response = await fetch('http://localhost:3000/api/statements/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: Number(selectedAccountId), csvContent, cardCsvContent })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to build preview')
      const fileNames = [nextAccountFile.name, needsCardFile && nextCardFile.name].filter(Boolean)
      setStaged({ fileNames, preview: data })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleAccountFile(file) {
    setAccountFile(file)
    buildPreview(file, cardFile)
  }

  function handleCardFile(file) {
    setCardFile(file)
    buildPreview(accountFile, file)
  }

  function resetFiles() {
    setAccountFile(null)
    setCardFile(null)
    setStaged(null)
    setError(null)
  }

  function handleAccountChange(id) {
    setSelectedAccountId(id)
    setUsesCreditCard(false)
    resetFiles()
  }

  function handleUsesCreditCardChange(checked) {
    setUsesCreditCard(checked)
    resetFiles()
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
        onChange={(e) => handleAccountChange(e.target.value)}
        disabled={!!staged}
      >
        {accounts.length === 0 && <option value="">No accounts yet</option>}
        {accounts.map((acc) => (
          <option key={acc.id} value={acc.id}>
            {acc.custom_name} ({acc.bank_type})
          </option>
        ))}
      </select>

      {supportsCardStatement && (
        <label className="card-statement-toggle">
          <input
            type="checkbox"
            checked={usesCreditCard}
            onChange={(e) => handleUsesCreditCardChange(e.target.checked)}
            disabled={!!staged}
          />
          <span>
            I pay with the credit card
            <small>Add the credit card export too. Its purchases replace the monthly card bill, so nothing is counted twice.</small>
          </span>
        </label>
      )}

      {staged ? (
        <div className="staged-file">
          {staged.fileNames.map((name) => (
            <p key={name}><strong>{name}</strong></p>
          ))}
          <p>{staged.preview.transactions.length} transactions found</p>
        </div>
      ) : (
        <div className="dropzones">
          <Dropzone
            label={needsCardFile ? 'Drop the account statement CSV here' : 'Drop your bank CSV here'}
            hint={needsCardFile ? 'or click to browse · Kontoumsätze export' : 'or click to browse · .csv from N26, Deutsche Bank or apoBank'}
            file={accountFile}
            loading={loading && !needsCardFile}
            onFile={handleAccountFile}
          />
          {needsCardFile && (
            <Dropzone
              label="Drop the credit card CSV here"
              hint="or click to browse · export it from the 1st to the last day of the month (a wider range is fine)"
              file={cardFile}
              loading={loading}
              onFile={handleCardFile}
            />
          )}
        </div>
      )}

      {error && <p style={{ color: '#dc2626' }}>{error}</p>}

      <div className="modal-actions">
        <button className="btn-secondary" onClick={staged ? resetFiles : onCancel}>
          {staged ? 'Choose different files' : 'Cancel'}
        </button>
        {staged && (
          <button className="btn-primary" onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  )
}

export default UploadModal
