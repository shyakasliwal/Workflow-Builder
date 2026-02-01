import React, { useRef, useEffect, useState } from 'react'
import WorkflowNode from './WorkflowNode'
import './WorkflowCanvas.css'

function WorkflowCanvas({ workflow, setWorkflow }) {
  const canvasRef = useRef(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [editingNodeId, setEditingNodeId] = useState(null)
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  // Calculate node positions for tree layout
  const calculateLayout = (node, x = 0, y = 0, level = 0) => {
    const horizontalSpacing = 300
    const verticalSpacing = 200

    const positions = {}
    const nodeData = { ...node, x, y }

    if (node.type === 'branch' && node.children && Array.isArray(node.children)) {
      // Branch nodes have multiple children (True/False)
      const branchCount = node.children.length
      if (branchCount > 0) {
        const totalWidth = (branchCount - 1) * horizontalSpacing
        const startX = x - totalWidth / 2

        node.children.forEach((child, index) => {
          const childX = startX + index * horizontalSpacing
          const childY = y + verticalSpacing
          const childPositions = calculateLayout(child, childX, childY, level + 1)
          Object.assign(positions, childPositions)
        })
      }
    } else if (node.children) {
      // Action nodes have one child (can be array with one item or single object)
      let child = null
      if (Array.isArray(node.children) && node.children.length > 0) {
        child = node.children[0]
      } else if (!Array.isArray(node.children)) {
        child = node.children
      }

      if (child) {
        const childX = x
        const childY = y + verticalSpacing
        const childPositions = calculateLayout(child, childX, childY, level + 1)
        Object.assign(positions, childPositions)
      }
    }

    positions[node.id] = nodeData
    return positions
  }

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const positions = calculateLayout(workflow, canvasSize.width / 2 - 100, 100)

  const handleAddNode = (parentId, nodeType, branchLabel = null) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeType,
      label: nodeType === 'action' ? 'Action' : nodeType === 'branch' ? 'Branch' : 'End',
      children: nodeType === 'branch' ? [] : nodeType === 'end' ? null : []
    }

    const addNodeRecursive = (node) => {
      if (node.id === parentId) {
        if (node.type === 'branch' && branchLabel !== null) {
          // Add to specific branch
          if (!node.children) {
            node.children = []
          }
          const branchIndex = node.children.findIndex(
            child => child.branchLabel === branchLabel
          )
          if (branchIndex >= 0) {
            // Insert between branch and existing child
            const existingChild = node.children[branchIndex]
            newNode.branchLabel = branchLabel
            if (existingChild.children) {
              // Existing child has children, insert new node
              if (Array.isArray(existingChild.children)) {
                newNode.children = [...existingChild.children]
              } else {
                newNode.children = [existingChild.children]
              }
            }
            node.children[branchIndex] = newNode
          } else {
            // Add new branch
            newNode.branchLabel = branchLabel
            node.children.push(newNode)
          }
        } else {
          // For action/start nodes, insert between parent and existing children
          if (node.children) {
            if (Array.isArray(node.children) && node.children.length > 0) {
              // Insert between parent and existing children
              newNode.children = [...node.children]
              node.children = [newNode]
            } else if (!Array.isArray(node.children)) {
              // Single child object
              newNode.children = [node.children]
              node.children = [newNode]
            } else {
              // Empty array
              node.children = [newNode]
            }
          } else {
            // No children, add as first child
            node.children = node.type === 'end' ? null : [newNode]
          }
        }
        return true
      }

      if (node.children) {
        if (Array.isArray(node.children)) {
          for (let child of node.children) {
            if (addNodeRecursive(child)) return true
          }
        } else if (addNodeRecursive(node.children)) {
          return true
        }
      }
      return false
    }

    const newWorkflow = JSON.parse(JSON.stringify(workflow))
    addNodeRecursive(newWorkflow)
    setWorkflow(newWorkflow)
  }

  const handleDeleteNode = (nodeId) => {
    if (nodeId === 'root') return // Cannot delete root

    const deleteNodeRecursive = (node, parent = null, parentKey = null) => {
      if (node.id === nodeId) {
        // Found the node to delete
        if (parent) {
          // Connect parent to deleted node's children
          if (node.children) {
            if (Array.isArray(node.children)) {
              // Replace this node with its children
              if (Array.isArray(parent[parentKey])) {
                const index = parent[parentKey].findIndex(n => n.id === nodeId)
                parent[parentKey].splice(index, 1, ...node.children)
              } else {
                parent[parentKey] = node.children.length > 0 ? node.children[0] : null
              }
            } else {
              parent[parentKey] = node.children
            }
          } else {
            // No children, just remove the node
            if (Array.isArray(parent[parentKey])) {
              parent[parentKey] = parent[parentKey].filter(n => n.id !== nodeId)
            } else {
              parent[parentKey] = null
            }
          }
        }
        return true
      }

      if (node.children) {
        if (Array.isArray(node.children)) {
          for (let i = 0; i < node.children.length; i++) {
            if (deleteNodeRecursive(node.children[i], node, 'children')) return true
          }
        } else if (deleteNodeRecursive(node.children, node, 'children')) {
          return true
        }
      }
      return false
    }

    const newWorkflow = JSON.parse(JSON.stringify(workflow))
    deleteNodeRecursive(newWorkflow)
    setWorkflow(newWorkflow)
  }

  const handleUpdateLabel = (nodeId, newLabel) => {
    const updateLabelRecursive = (node) => {
      if (node.id === nodeId) {
        node.label = newLabel
        return true
      }

      if (node.children) {
        if (Array.isArray(node.children)) {
          for (let child of node.children) {
            if (updateLabelRecursive(child)) return true
          }
        } else if (updateLabelRecursive(node.children)) {
          return true
        }
      }
      return false
    }

    const newWorkflow = JSON.parse(JSON.stringify(workflow))
    updateLabelRecursive(newWorkflow)
    setWorkflow(newWorkflow)
  }

  const renderConnections = (node) => {
    const connections = []
    const nodePos = positions[node.id]
    if (!nodePos) return connections

    if (node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach((child, index) => {
          const childPos = positions[child.id]
          if (childPos) {
            const startX = nodePos.x + 100 // Center of parent node
            const startY = nodePos.y + 120 // Bottom of parent node
            const endX = childPos.x + 100 // Center of child node
            const endY = childPos.y // Top of child node

            // Calculate control points for smooth curve
            const midY = startY + (endY - startY) / 2
            const controlY1 = startY + 50
            const controlY2 = endY - 50

            connections.push(
              <g key={`connection-${node.id}-${child.id}-${index}`}>
                <path
                  d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
                  stroke="#3498db"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                />
                {node.type === 'branch' && child.branchLabel && (
                  <text
                    x={startX + (endX - startX) / 2}
                    y={midY - 10}
                    textAnchor="middle"
                    fill="#2c3e50"
                    fontSize="12"
                    fontWeight="600"
                  >
                    {child.branchLabel}
                  </text>
                )}
              </g>
            )
          }
        })
      } else {
        const childPos = positions[node.children.id]
        if (childPos) {
          const startX = nodePos.x + 100
          const startY = nodePos.y + 120
          const endX = childPos.x + 100
          const endY = childPos.y

          const midY = startY + (endY - startY) / 2
          const controlY1 = startY + 50
          const controlY2 = endY - 50

          connections.push(
            <path
              key={`connection-${node.id}-${node.children.id}`}
              d={`M ${startX} ${startY} C ${startX} ${controlY1}, ${endX} ${controlY2}, ${endX} ${endY}`}
              stroke="#3498db"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />
          )
        }
      }
    }

    // Recursively get connections from children
    if (node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach(child => {
          connections.push(...renderConnections(child))
        })
      } else {
        connections.push(...renderConnections(node.children))
      }
    }

    return connections
  }

  const renderNodes = (node) => {
    const nodePos = positions[node.id]
    if (!nodePos) return null

    const nodes = [
      <WorkflowNode
        key={node.id}
        node={node}
        x={nodePos.x}
        y={nodePos.y}
        selected={selectedNodeId === node.id}
        editing={editingNodeId === node.id}
        onSelect={() => setSelectedNodeId(node.id)}
        onAddNode={handleAddNode}
        onDeleteNode={handleDeleteNode}
        onEditStart={() => setEditingNodeId(node.id)}
        onEditEnd={() => setEditingNodeId(null)}
        onUpdateLabel={handleUpdateLabel}
      />
    ]

    if (node.children) {
      if (Array.isArray(node.children)) {
        node.children.forEach(child => {
          nodes.push(...renderNodes(child))
        })
      } else {
        nodes.push(...renderNodes(node.children))
      }
    }

    return nodes
  }

  // Calculate canvas dimensions based on node positions
  const canvasWidth = Math.max(
    ...Object.values(positions).map(p => p.x + 300),
    canvasSize.width
  )
  const canvasHeight = Math.max(
    ...Object.values(positions).map(p => p.y + 200),
    canvasSize.height
  )

  return (
    <div className="workflow-canvas-container" ref={canvasRef}>
      <svg 
        className="workflow-canvas-svg"
        width={canvasWidth}
        height={canvasHeight}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3498db" />
          </marker>
        </defs>
        {renderConnections(workflow)}
      </svg>
      <div 
        className="workflow-canvas-nodes"
        style={{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }}
      >
        {renderNodes(workflow)}
      </div>
    </div>
  )
}

export default WorkflowCanvas
