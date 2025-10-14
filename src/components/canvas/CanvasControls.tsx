import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import { useAuth } from '../../hooks/useAuth'
import { getRandomColor, getViewportCenter } from '../../lib/utils'
import type { Rectangle } from '../../types'
import RectangleProperties from './RectangleProperties'

interface CanvasControlsProps {
  viewportWidth: number
  viewportHeight: number
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  clearAllShapes: () => Promise<void>
  shapesError: string | null
  onRetry: () => void
  onSidebarToggle?: () => void
  sidebarOpen?: boolean
}

const CanvasControls: React.FC<CanvasControlsProps> = ({ 
  viewportWidth, 
  viewportHeight,
  createShape,
  deleteShape,
  clearAllShapes,
  shapesError,
  onRetry,
  onSidebarToggle,
  sidebarOpen
}) => {
  const { user } = useAuth()
  const { stageScale, stagePosition, resetView, updateScale, updatePosition, selectedShapeId } = useCanvasStore()
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

  const handleCreateRectangle = async () => {
    if (!user) return
    
    try {
      // Calculate viewport center
      const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight)
      
      // Create new rectangle data
      const newRectangleData = {
        x: center.x - 50, // Center the rectangle (100px width / 2)
        y: center.y - 40, // Center the rectangle (80px height / 2)
        width: 100,
        height: 80,
        rotation: 0, // Default rotation
        fill: getRandomColor(),
        createdBy: user.uid
      }
      
      await createShape(newRectangleData)
    } catch (error) {
      console.error('Error creating rectangle:', error)
    }
  }

  const handleDeleteRectangle = async () => {
    if (selectedShapeId) {
      if (window.confirm('Are you sure you want to delete this rectangle?')) {
        try {
          await deleteShape(selectedShapeId)
        } catch (error) {
          console.error('Error deleting rectangle:', error)
        }
      }
    }
  }

  const handleResetCanvas = async () => {
    if (window.confirm('Are you sure you want to reset the canvas? This will delete all shapes and reset the view.')) {
      try {
        // Clear all shapes from both local state and Firestore
        await clearAllShapes()
        
        // Reset view to center and 100% zoom
        resetView()
      } catch (error) {
        console.error('Error resetting canvas:', error)
      }
    }
  }


  return (
    <div className="bg-gray-100 border-b border-gray-300">
      {/* Error Display */}
      {shapesError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">
                {shapesError}
              </span>
            </div>
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center gap-4 p-4 flex-wrap">
        {/* Sidebar Toggle */}
        {onSidebarToggle && (
          <div className="flex items-center gap-2">
            <button
              onClick={onSidebarToggle}
              className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center gap-2"
              title={sidebarOpen ? 'Hide Users' : 'Show Users'}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {sidebarOpen ? 'Hide Users' : 'Show Users'}
            </button>
          </div>
        )}

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

        {/* Reset Canvas Button */}
        <button
          onClick={handleResetCanvas}
          className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Reset Canvas - Delete all shapes and reset view"
        >
          Reset Canvas
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
