import React, { useState, useRef, useEffect } from 'react'
import './WorkflowNode.css'

function WorkflowNode({
  node,
  x,
  y,
  selected,
  editing,
  onSelect,
  onAddNode,
  onDeleteNode,
  onEditStart,
  onEditEnd,
  onUpdateLabel
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [showConnectionMenu, setShowConnectionMenu] = useState(null) 
  const [editValue, setEditValue] = useState(node.label)
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const connectionMenuRef = useRef(null)

 
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
      if (connectionMenuRef.current && !connectionMenuRef.current.contains(event.target)) {
        setShowConnectionMenu(null)
      }
    }

    if (showMenu || showConnectionMenu !== null) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [showMenu, showConnectionMenu])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleLabelClick = (e) => {
    e.stopPropagation()
    if (!editing) {
      onEditStart()
      setEditValue(node.label)
    }
  }

  const handleLabelBlur = () => {
    if (editValue.trim()) {
      onUpdateLabel(node.id, editValue.trim())
    }
    onEditEnd()
  }

  const handleLabelKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur()
    } else if (e.key === 'Escape') {
      setEditValue(node.label)
      onEditEnd()
    }
  }

  const handleAddClick = (e, nodeType, branchLabel = null) => {
    e.stopPropagation()
    onAddNode(node.id, nodeType, branchLabel)
    setShowMenu(false)
    setShowConnectionMenu(null)
  }

  const handleConnectionPointClick = (e, branchLabel = null) => {
    e.stopPropagation()
    setShowConnectionMenu(branchLabel)
    setShowMenu(false)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to delete this node?')) {
      onDeleteNode(node.id)
    }
    setShowMenu(false)
  }

  const getNodeClass = () => {
    let className = 'workflow-node'
    className += ` workflow-node-${node.type}`
    if (selected) className += ' workflow-node-selected'
    if (editing) className += ' workflow-node-editing'
    return className
  }

  const canAddNode = node.type !== 'end'
  const canDeleteNode = node.id !== 'root'

  return (
    <div
      className={getNodeClass()}
      style={{ left: `${x}px`, top: `${y}px` }}
      onClick={onSelect}
    >
      <div className="workflow-node-header">
        <span className="workflow-node-type">{node.type.toUpperCase()}</span>
        {canDeleteNode && (
          <button
            className="workflow-node-delete-btn"
            onClick={handleDeleteClick}
            title="Delete node"
          >
            ×
          </button>
        )}
      </div>

      <div className="workflow-node-content">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            className="workflow-node-input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={handleLabelKeyDown}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div
            className="workflow-node-label"
            onClick={handleLabelClick}
            title="Click to edit"
          >
            {node.label}
          </div>
        )}
      </div>

      {canAddNode && (
        <div className="workflow-node-actions">
          <button
            className="workflow-node-add-btn"
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            title="Add node"
          >
            + Add Node
          </button>
          {showMenu && (
            <div 
              ref={menuRef}
              className="workflow-node-menu" 
              onClick={(e) => e.stopPropagation()}
            >
              {node.type === 'branch' ? (
                <>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'action', 'True')}
                  >
                    Add Action (True branch)
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'action', 'False')}
                  >
                    Add Action (False branch)
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'branch', 'True')}
                  >
                    Add Branch (True branch)
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'branch', 'False')}
                  >
                    Add Branch (False branch)
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'end', 'True')}
                  >
                    Add End (True branch)
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'end', 'False')}
                  >
                    Add End (False branch)
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'action')}
                  >
                    Add Action
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'branch')}
                  >
                    Add Branch
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'end')}
                  >
                    Add End
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {node.type === 'branch' && node.children && node.children.length > 0 && (
        <div className="workflow-node-branches">
          {node.children.map((child, index) => (
            <div key={index} className="workflow-node-branch-label">
              {child.branchLabel || `Branch ${index + 1}`}
            </div>
          ))}
        </div>
      )}

      
      {canAddNode && (
        <div className="workflow-node-connection-points">
          {node.type === 'branch' ? (
            // Branch nodes: connection point for each branch
            node.children && node.children.length > 0 ? (
              node.children.map((child, index) => {
                const branchLabel = child.branchLabel || `Branch ${index + 1}`
                return (
                  <div key={index} className="workflow-node-connection-group">
                    <div
                      className="workflow-node-connection-point"
                      onClick={(e) => handleConnectionPointClick(e, branchLabel)}
                      title={`Add node to ${branchLabel} branch`}
                    >
                      <div className="workflow-node-connection-dot"></div>
                      <span className="workflow-node-connection-label">{branchLabel}</span>
                    </div>
                    {showConnectionMenu === branchLabel && (
                      <div
                        ref={connectionMenuRef}
                        className="workflow-node-connection-menu"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="workflow-node-menu-item"
                          onClick={(e) => handleAddClick(e, 'action', branchLabel)}
                        >
                          Action
                        </button>
                        <button
                          className="workflow-node-menu-item"
                          onClick={(e) => handleAddClick(e, 'branch', branchLabel)}
                        >
                          Branch
                        </button>
                        <button
                          className="workflow-node-menu-item"
                          onClick={(e) => handleAddClick(e, 'end', branchLabel)}
                        >
                          End
                        </button>
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
            
              <>
                <div className="workflow-node-connection-group">
                  <div
                    className="workflow-node-connection-point"
                    onClick={(e) => handleConnectionPointClick(e, 'True')}
                    title="Add node to True branch"
                  >
                    <div className="workflow-node-connection-dot"></div>
                    <span className="workflow-node-connection-label">True</span>
                  </div>
                  {showConnectionMenu === 'True' && (
                    <div
                      ref={connectionMenuRef}
                      className="workflow-node-connection-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'action', 'True')}
                      >
                        Action
                      </button>
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'branch', 'True')}
                      >
                        Branch
                      </button>
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'end', 'True')}
                      >
                        End
                      </button>
                    </div>
                  )}
                </div>
                <div className="workflow-node-connection-group">
                  <div
                    className="workflow-node-connection-point"
                    onClick={(e) => handleConnectionPointClick(e, 'False')}
                    title="Add node to False branch"
                  >
                    <div className="workflow-node-connection-dot"></div>
                    <span className="workflow-node-connection-label">False</span>
                  </div>
                  {showConnectionMenu === 'False' && (
                    <div
                      ref={connectionMenuRef}
                      className="workflow-node-connection-menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'action', 'False')}
                      >
                        Action
                      </button>
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'branch', 'False')}
                      >
                        Branch
                      </button>
                      <button
                        className="workflow-node-menu-item"
                        onClick={(e) => handleAddClick(e, 'end', 'False')}
                      >
                        End
                      </button>
                    </div>
                  )}
                </div>
              </>
            )
          ) : (
           
            <div className="workflow-node-connection-group">
              <div
                className="workflow-node-connection-point workflow-node-connection-point-center"
                onClick={(e) => handleConnectionPointClick(e, 'main')}
                title="Add node"
              >
                <div className="workflow-node-connection-dot"></div>
              </div>
              {showConnectionMenu === 'main' && (
                <div
                  ref={connectionMenuRef}
                  className="workflow-node-connection-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'action')}
                  >
                    Action
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'branch')}
                  >
                    Branch
                  </button>
                  <button
                    className="workflow-node-menu-item"
                    onClick={(e) => handleAddClick(e, 'end')}
                  >
                    End
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default WorkflowNode
