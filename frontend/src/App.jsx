import { useState } from 'react'
import './App.css'
import Dashboard from './Dashboard'
import UploadModal from './UploadModal'
import CategorizeReview from './CategorizeReview'
import StatementDetail from './StatementDetail'
import AddAccountModal from './AddAccountModal'
import CategoriesSettings from './CategoriesSetting'
import RulesSettings from './RulesSettings'
import NavBar from './NavBar'
import Modal from './Modal'

function App() {
  const [screen, setScreen] = useState('dashboard') // 'dashboard' | 'review' | 'detail'
  const [activeModal, setActiveModal] = useState(null) // null | 'add-account' | 'categories' | 'upload'
  const [preview, setPreview] = useState(null)
  const [selectedStatementId, setSelectedStatementId] = useState(null)

  function handlePreviewReady(data) {
    setPreview(data)
    setScreen('review')
    setActiveModal(null)
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

  function closeModal() {
    setActiveModal(null)
  }

  return (
    <div className="app">
      <NavBar 
          onAddAccountClick={() => setActiveModal('add-account')}
          onCategoriesClick={() => setActiveModal('categories')}
          onRulesClick={() => setActiveModal('rules')}>
          
          </NavBar>
      

      {screen === 'dashboard' && (
<Dashboard
          onUploadClick={() => setActiveModal('upload')}
          onStatementClick={handleStatementClick}
        />
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

      {activeModal === 'add-account' && (
        <Modal onClose={closeModal}>
          <AddAccountModal onCancel={closeModal} onCreated={closeModal} />
        </Modal>
      )}

      {activeModal === 'categories' && (
        <Modal onClose={closeModal}>
          <CategoriesSettings onBack={closeModal} />
        </Modal>
      )}

      {activeModal === 'upload' && (
        <Modal onClose={closeModal}>
          <UploadModal onCancel={closeModal} onPreviewReady={handlePreviewReady} />
        </Modal>
      )}

        {activeModal === 'rules' && (
        <Modal onClose={closeModal} size='large'>
          <RulesSettings onBack={closeModal} />
        </Modal>
      )}
    </div>
  )
}

export default App