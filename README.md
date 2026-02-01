# Workflow Builder UI

A complete Workflow Builder UI built with React (JavaScript) without any external UI or workflow libraries.

## Features

- **Node Types**:
  - Start Node (root)
  - Action Node (exactly 1 outgoing child)
  - Branch Node (multiple children with True/False branches)
  - End Node (0 children)

- **Interactions**:
  - Add new nodes after any non-End node
  - Delete nodes (except root) with automatic parent-child reconnection
  - Edit node labels in place
  - Visual tree layout with connection lines

- **Pure CSS Styling**: Modern, gradient-based design with smooth animations

- **Bonus Features**:
  - **Save/Load**: Save button logs the entire workflow JSON structure to the browser console
  - **Undo/Redo**: Full undo/redo functionality with keyboard shortcuts (Ctrl+Z / Ctrl+Y)
  - **Interactive Connection Points**: Click connection points at the bottom of nodes to add new nodes with a context-sensitive menu

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Usage

### Adding Nodes
- **Method 1**: Click the "+ Add Node" button on any node
- **Method 2**: Click the connection point (dot) at the bottom of any non-End node to see a context menu

### Editing Nodes
- Click any node's label to edit it in place
- Press Enter to save or Escape to cancel

### Deleting Nodes
- Click the "×" button on any node (except root)
- The parent will automatically reconnect to the deleted node's children

### Undo/Redo
- Use the Undo/Redo buttons in the header
- Or use keyboard shortcuts: **Ctrl+Z** (Undo) / **Ctrl+Y** or **Ctrl+Shift+Z** (Redo)

### Saving
- Click the "💾 Save" button to log the workflow JSON to the browser console
- Open Developer Tools (F12) to view the console output

## Data Model

The workflow is represented as a tree structure:

```javascript
{
  id: 'root',
  type: 'start', // 'start' | 'action' | 'branch' | 'end'
  label: 'Start',
  children: [] // Array for branch nodes, single item for action nodes, null for end nodes
}
```

For branch nodes, children include a `branchLabel` property ('True' or 'False').
