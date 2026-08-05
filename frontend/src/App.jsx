import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import UploadModal from './UploadModal'
import CategorizeReview from './CategorizeReview'
import StatementDetail from './StatementDetail'
import AddAccountModal from './AddAccountModal'

function App() {
  const [screen, setScreen] = useState('dashboard') // 'dashboard' | 'upload' | 'review' | 'detail' | 'add-account'
  const [preview, setPreview] = useState(null)
  const [selectedStatementId, setSelectedStatementId] = useState(null)

  function handlePreviewReady(data) {
    setPreview(data)
    setScreen('review')
  }

  function handleBackToDashboard() {
    setPreview(null)
    setSelectedStatementId(null)
    setScreen('dashboard')
  }

  function handleStatementClick(statementId) {
    setSelectedStatementId(statementId)
    setScreen('detail')
  }

  return (
    <div className="app">
      <header><h1>Monthly</h1></header>

      {screen === 'dashboard' && (
        <Dashboard
          onUploadClick={() => setScreen('upload')}
          onStatementClick={handleStatementClick}
          onAddAccountClick={() => setScreen('add-account')}
        />
      )}

      {screen === 'upload' && (
        <UploadModal onCancel={handleBackToDashboard} onPreviewReady={handlePreviewReady} />
      )}

      {screen === 'review' && preview && (
        <CategorizeReview
          preview={preview}
          onCancel={handleBackToDashboard}
          onCommitted={handleBackToDashboard}
        />
      )}

      {screen === 'detail' && selectedStatementId && (
        <StatementDetail statementId={selectedStatementId} onBack={handleBackToDashboard} />
      )}

      {screen === 'add-account' && (
        <AddAccountModal onCancel={handleBackToDashboard} onCreated={handleBackToDashboard} />
      )}
    </div>
  )
}

export default App