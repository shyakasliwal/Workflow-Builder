import React, { useState, useRef, useCallback } from 'react'
import WorkflowCanvas from './components/WorkflowCanvas'
import './App.css'

function App() {
  const initialWorkflow = {
    id: 'root',
    type: 'start',
    label: 'Start',
    children: []
  }

  const [workflow, setWorkflow] = useState(initialWorkflow)
  const historyRef = useRef([JSON.parse(JSON.stringify(initialWorkflow))])
  const historyIndexRef = useRef(0)
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const updateWorkflow = useCallback((newWorkflow, addToHistory = true) => {
    setWorkflow(newWorkflow)
    
    if (addToHistory) {
      
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1)
    
      historyRef.current.push(JSON.parse(JSON.stringify(newWorkflow)))
      historyIndexRef.current = historyRef.current.length - 1
    
      if (historyRef.current.length > 50) {
        historyRef.current.shift()
        historyIndexRef.current--
      }
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(false)
    }
  }, [])

  const handleUndo = () => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current--
      const previousState = historyRef.current[historyIndexRef.current]
      setWorkflow(JSON.parse(JSON.stringify(previousState)))
      setCanUndo(historyIndexRef.current > 0)
      setCanRedo(true)
    }
  }

  const handleRedo = () => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current++
      const nextState = historyRef.current[historyIndexRef.current]
      setWorkflow(JSON.parse(JSON.stringify(nextState)))
      setCanUndo(true)
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1)
    }
  }

  const handleSave = () => {
    console.log('=== Workflow Data Structure ===')
    console.log(JSON.stringify(workflow, null, 2))
    console.log('==============================')
    alert('Workflow saved to console! Check the browser console (F12) to see the JSON data.')
  }

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (canUndo) handleUndo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (canRedo) handleRedo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, canRedo])

  return (
    <div className="app">
      <header className="app-header">
        <h1>Workflow Builder</h1>
        <div className="app-header-actions">
          <button 
            className="app-btn app-btn-undo" 
            onClick={handleUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button 
            className="app-btn app-btn-redo" 
            onClick={handleRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <button 
            className="app-btn app-btn-save" 
            onClick={handleSave}
            title="Save workflow to console"
          >
            💾 Save
          </button>
        </div>
      </header>
      <WorkflowCanvas workflow={workflow} setWorkflow={updateWorkflow} />
    </div>
  )
}

export default App
