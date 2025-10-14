import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import { generateId, getRandomColor, getViewportCenter } from '../../lib/utils'
import type { Rectangle } from '../../types'
import RectangleProperties from './RectangleProperties'

interface CanvasControlsProps {
  viewportWidth: number
  viewportHeight: number
}

const CanvasControls: React.FC<CanvasControlsProps> = ({ viewportWidth, viewportHeight }) => {
  const { stageScale, stagePosition, resetView, updateScale, updatePosition, addShape, selectedShapeId, deleteShape } = useCanvasStore()
  const [zoomInput, setZoomInput] = useState('')
  const [panXInput, setPanXInput] = useState('')
  const [panYInput, setPanYInput] = useState('')

  // Update inputs when values change externally
  useEffect(() => {
    setZoomInput(Math.round(stageScale * 100).toString())
    setPanXInput(Math.round(stagePosition.x).toString())
    setPanYInput(Math.round(stagePosition.y).toString())
  }, [stageScale, stagePosition])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedShapeId) {
        e.preventDefault()
        handleDeleteRectangle()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedShapeId])

  const handleZoomIn = () => {
    updateScale(stageScale * 1.1)
  }

  const handleZoomOut = () => {
    updateScale(stageScale / 1.1)
  }

  const handleResetView = () => {
    resetView()
  }

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZoomInput(e.target.value)
  }

  const handleZoomInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(zoomInput)
    if (!isNaN(value) && value > 0) {
      const clampedValue = Math.max(10, Math.min(300, value)) // 10% to 300%
      updateScale(clampedValue / 100)
    } else {
      // Reset to current value if invalid
      setZoomInput(Math.round(stageScale * 100).toString())
    }
  }

  const handleZoomInputBlur = () => {
    // Reset to current value if input is invalid on blur
    const value = parseFloat(zoomInput)
    if (isNaN(value) || value <= 0) {
      setZoomInput(Math.round(stageScale * 100).toString())
    }
  }

  const handlePanXInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanXInput(e.target.value)
  }

  const handlePanYInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanYInput(e.target.value)
  }

  const handlePanXSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(panXInput)
    if (!isNaN(value)) {
      // Clamp X value within canvas bounds (-2500 to 2500)
      const clampedX = Math.max(-2500, Math.min(2500, value))
      updatePosition(clampedX, stagePosition.y)
    } else {
      setPanXInput(Math.round(stagePosition.x).toString())
    }
  }

  const handlePanYSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(panYInput)
    if (!isNaN(value)) {
      // Clamp Y value within canvas bounds (-2500 to 2500)
      const clampedY = Math.max(-2500, Math.min(2500, value))
      updatePosition(stagePosition.x, clampedY)
    } else {
      setPanYInput(Math.round(stagePosition.y).toString())
    }
  }

  const handlePanXBlur = () => {
    const value = parseFloat(panXInput)
    if (isNaN(value)) {
      setPanXInput(Math.round(stagePosition.x).toString())
    }
  }

  const handlePanYBlur = () => {
    const value = parseFloat(panYInput)
    if (isNaN(value)) {
      setPanYInput(Math.round(stagePosition.y).toString())
    }
  }

  const handleCreateRectangle = () => {
    // Calculate viewport center
    const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight)
    
    // Create new rectangle
    const newRectangle: Rectangle = {
      id: generateId(),
      x: center.x - 50, // Center the rectangle (100px width / 2)
      y: center.y - 40, // Center the rectangle (80px height / 2)
      width: 100,
      height: 80,
      fill: getRandomColor(),
      createdBy: 'current-user', // TODO: Get from auth context
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    
    addShape(newRectangle)
  }

  const handleDeleteRectangle = () => {
    if (selectedShapeId) {
      if (window.confirm('Are you sure you want to delete this rectangle?')) {
        deleteShape(selectedShapeId)
      }
    }
  }


  return (
    <div className="bg-gray-100 border-b border-gray-300">
      {/* Main Controls */}
      <div className="flex items-center gap-4 p-4 flex-wrap">
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom Out (Ctrl+-)"
          >
            −
          </button>
          
          {/* Zoom Input Field */}
          <form onSubmit={handleZoomInputSubmit} className="flex items-center">
            <input
              type="number"
              value={zoomInput}
              onChange={handleZoomInputChange}
              onBlur={handleZoomInputBlur}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="300"
              step="1"
              title="Enter zoom percentage (10-300%)"
            />
            <span className="ml-1 text-sm text-gray-600">%</span>
          </form>
          
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom In (Ctrl++)"
          >
            +
          </button>
        </div>

        {/* Pan Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 font-medium">Pan:</span>
          
          {/* Pan X Input */}
          <form onSubmit={handlePanXSubmit} className="flex items-center">
            <label className="text-xs text-gray-500">X:</label>
            <input
              type="number"
              value={panXInput}
              onChange={handlePanXInputChange}
              onBlur={handlePanXBlur}
              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pan X coordinate"
            />
          </form>
          
          {/* Pan Y Input */}
          <form onSubmit={handlePanYSubmit} className="flex items-center">
            <label className="text-xs text-gray-500">Y:</label>
            <input
              type="number"
              value={panYInput}
              onChange={handlePanYInputChange}
              onBlur={handlePanYBlur}
              className="w-20 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pan Y coordinate"
            />
          </form>
        </div>

        {/* Rectangle Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateRectangle}
            className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            title="Add Rectangle"
          >
            + Rectangle
          </button>
          
          {selectedShapeId && (
            <button
              onClick={handleDeleteRectangle}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Delete Selected Rectangle"
            >
              Delete
            </button>
          )}
        </div>

        {/* Reset View Button */}
        <button
          onClick={handleResetView}
          className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          title="Reset View (Escape)"
        >
          Reset View
        </button>

        {/* Rectangle Properties - Inline */}
        {selectedShapeId && (
          <div className="flex items-center gap-2">
            <RectangleProperties selectedShapeId={selectedShapeId} />
          </div>
        )}

      </div>
    </div>
  )
}

export default CanvasControls
