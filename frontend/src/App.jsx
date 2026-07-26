import { useState, useEffect } from 'react'

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('http://localhost:3000/api/health')
      .then((res) => res.json())
      .then((data) => setHealth(data.status))
      .catch((err) => setHealth('error: ' + err.message))
  }, [])

  return (
    <div>
      <h1>Monthly</h1>
      <p>Backend status: {health ?? 'loading...'}</p>
    </div>
  )
}

export default App