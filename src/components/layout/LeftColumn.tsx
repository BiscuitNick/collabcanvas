import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import { useAuth } from '../../hooks/useAuth'
import { getRandomColor, getViewportCenter } from '../../lib/utils'
import { CANVAS_HALF } from '../../lib/constants'
import type { Rectangle } from '../../types'
import RectangleProperties from '../canvas/RectangleProperties'
import AIWidget from '../canvas/AIWidget'
import type { PresenceUser, Cursor as CursorType } from '../../types'

interface CollapsibleSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-t-lg"
      >
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
        <svg
          className={`w-4 h-4 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-3 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}

interface LeftColumnProps {
  viewportWidth: number
  viewportHeight: number
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  clearAllShapes: () => Promise<void>
  shapesError: string | null
  onRetry: () => void
  presenceUsers: PresenceUser[]
  cursors: CursorType[]
  shapes: Rectangle[]
  onUserClick?: (userId: string) => void
  onShapeSelect?: (shapeId: string) => void
  onDebugStateChange?: (showSelfCursor: boolean) => void
}

const LeftColumn: React.FC<LeftColumnProps> = ({
  viewportWidth,
  viewportHeight,
  createShape,
  deleteShape,
  clearAllShapes,
  shapesError,
  onRetry,
  presenceUsers,
  cursors,
  shapes,
  onUserClick,
  onShapeSelect,
  onDebugStateChange
}) => {
  const { user, logout } = useAuth()
  const { stageScale, stagePosition, resetView, updateScale, updatePosition, selectedShapeId } = useCanvasStore()
  const [zoomInput, setZoomInput] = useState('')
  const [panXInput, setPanXInput] = useState('')
  const [panYInput, setPanYInput] = useState('')
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [showSelfCursor, setShowSelfCursor] = useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDeleteRectangle = useCallback(async () => {
    if (selectedShapeId) {
      if (window.confirm('Are you sure you want to delete this rectangle?')) {
        try {
          await deleteShape(selectedShapeId)
        } catch (error) {
          console.error('Error deleting rectangle:', error)
        }
      }
    }
  }, [selectedShapeId, deleteShape])

  // Update inputs when values change externally
  useEffect(() => {
    setZoomInput(Math.round(stageScale * 100).toString())
    setPanXInput(Math.round(stagePosition.x).toString())
    setPanYInput(Math.round(stagePosition.y).toString())
  }, [stageScale, stagePosition])

  // Notify parent when debug state changes
  useEffect(() => {
    if (onDebugStateChange) {
      onDebugStateChange(showSelfCursor)
    }
  }, [showSelfCursor, onDebugStateChange])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

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
  }, [selectedShapeId, handleDeleteRectangle])

  const handleZoomIn = () => {
    const newScale = Math.min(3, stageScale + 0.1) // Increment by 10%
    
    // Calculate new position to keep canvas center fixed
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    
    // Current center in canvas space
    const currentCenterX = (centerX - stagePosition.x) / stageScale
    const currentCenterY = (centerY - stagePosition.y) / stageScale
    
    // New stage position to keep the same center point
    const newX = centerX - currentCenterX * newScale
    const newY = centerY - currentCenterY * newScale
    
    updateScale(newScale)
    updatePosition(newX, newY)
  }

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, stageScale - 0.1) // Decrement by 10%
    
    // Calculate new position to keep canvas center fixed
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    
    // Current center in canvas space
    const currentCenterX = (centerX - stagePosition.x) / stageScale
    const currentCenterY = (centerY - stagePosition.y) / stageScale
    
    // New stage position to keep the same center point
    const newX = centerX - currentCenterX * newScale
    const newY = centerY - currentCenterY * newScale
    
    updateScale(newScale)
    updatePosition(newX, newY)
  }

  const handleResetView = () => {
    resetView()
  }

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setZoomInput(value)
    
    // Clear existing timeout
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current)
    }
    
    // Apply zoom in real-time as user types (with debounce)
    const numValue = parseFloat(value)
    if (!isNaN(numValue) && numValue > 0) {
      zoomTimeoutRef.current = setTimeout(() => {
        const clampedValue = Math.max(10, Math.min(300, numValue)) // 10% to 300%
        const newScale = clampedValue / 100
        
        // Calculate new position to keep canvas center fixed
        const centerX = viewportWidth / 2
        const centerY = viewportHeight / 2
        
        // Current center in canvas space
        const currentCenterX = (centerX - stagePosition.x) / stageScale
        const currentCenterY = (centerY - stagePosition.y) / stageScale
        
        // New stage position to keep the same center point
        const newX = centerX - currentCenterX * newScale
        const newY = centerY - currentCenterY * newScale
        
        updateScale(newScale)
        updatePosition(newX, newY)
      }, 100) // 100ms debounce
    }
  }

  const applyZoomFromInput = () => {
    const value = parseFloat(zoomInput)
    if (!isNaN(value) && value > 0) {
      const clampedValue = Math.max(10, Math.min(300, value)) // 10% to 300%
      const newScale = clampedValue / 100
      
      // Calculate new position to keep canvas center fixed
      const centerX = viewportWidth / 2
      const centerY = viewportHeight / 2
      
      // Current center in canvas space
      const currentCenterX = (centerX - stagePosition.x) / stageScale
      const currentCenterY = (centerY - stagePosition.y) / stageScale
      
      // New stage position to keep the same center point
      const newX = centerX - currentCenterX * newScale
      const newY = centerY - currentCenterY * newScale
      
      updateScale(newScale)
      updatePosition(newX, newY)
      setZoomInput(clampedValue.toString()) // Update input to show clamped value
    } else {
      // Reset to current value if invalid
      setZoomInput(Math.round(stageScale * 100).toString())
    }
  }

  const handleZoomInputSubmit = (e: React.KeyboardEvent | React.FormEvent) => {
    e.preventDefault()
    applyZoomFromInput()
  }

  const handleZoomInputBlur = () => {
    applyZoomFromInput()
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
      // Clamp X value within canvas bounds
      const clampedX = Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, value))
      updatePosition(clampedX, stagePosition.y)
    } else {
      setPanXInput(Math.round(stagePosition.x).toString())
    }
  }

  const handlePanYSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const value = parseFloat(panYInput)
    if (!isNaN(value)) {
      // Clamp Y value within canvas bounds
      const clampedY = Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, value))
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

  const handleUserClick = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId)
    if (onUserClick) {
      onUserClick(userId)
    }
  }

  const getUserCursor = (userId: string) => {
    return cursors.find(cursor => cursor.userId === userId)
  }

  const handleShapeSelect = (shapeId: string) => {
    if (onShapeSelect) {
      onShapeSelect(shapeId)
    }
  }

  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      {/* Error Display */}
      {shapesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
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

      {/* Canvas Controls Section */}
      <CollapsibleSection title="Canvas Controls" defaultOpen={true}>
        <div className="space-y-4">
          {/* Zoom Controls */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Zoom</label>
            <div className="flex items-center gap-2">
              <button
                onClick={handleZoomOut}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Zoom Out"
              >
                −
              </button>
              
              <button
                onClick={handleZoomIn}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                title="Zoom In"
              >
                +
              </button>
              
              <div className="flex items-center">
                <input
                  type="number"
                  value={zoomInput}
                  onChange={handleZoomInputChange}
                  onBlur={handleZoomInputBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleZoomInputSubmit(e)
                    }
                  }}
                  className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="10"
                  max="300"
                  step="1"
                  title="Enter zoom percentage (10-300%)"
                />
                <span className="ml-1 text-sm text-gray-600">%</span>
              </div>
            </div>
          </div>

          {/* Pan Controls */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Pan Position</label>
            <div className="space-y-2">
              <form onSubmit={handlePanXSubmit} className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-4">X:</label>
                <input
                  type="number"
                  value={panXInput}
                  onChange={handlePanXInputChange}
                  onBlur={handlePanXBlur}
                  className="flex-1 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Pan X coordinate"
                />
              </form>
              
              <form onSubmit={handlePanYSubmit} className="flex items-center gap-2">
                <label className="text-xs text-gray-500 w-4">Y:</label>
                <input
                  type="number"
                  value={panYInput}
                  onChange={handlePanYInputChange}
                  onBlur={handlePanYBlur}
                  className="flex-1 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Pan Y coordinate"
                />
              </form>
            </div>
          </div>

          {/* View Controls */}
          <div className="space-y-2">
            <button
              onClick={handleResetView}
              className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              title="Reset View"
            >
              Reset View
            </button>
            
            <button
              onClick={handleResetCanvas}
              className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              title="Reset Canvas - Delete all shapes and reset view"
            >
              Reset Canvas
            </button>
          </div>

        </div>
      </CollapsibleSection>

      {/* AI Assistant Section */}
      <CollapsibleSection title="AI Assistant" defaultOpen={true}>
        <AIWidget
          stageScale={stageScale}
          stagePosition={stagePosition}
          createShape={createShape}
        />
      </CollapsibleSection>

      {/* Shape Controls Section */}
      <CollapsibleSection title="Shape Controls" defaultOpen={true}>
        <div className="space-y-4">
          <div className="space-y-2">
            <button
              onClick={handleCreateRectangle}
              className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="Add Rectangle"
            >
              + Add Rectangle
            </button>
            
            {selectedShapeId && (
              <button
                onClick={handleDeleteRectangle}
                className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete Selected Rectangle"
              >
                Delete Selected
              </button>
            )}
          </div>

          {/* Shapes List */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-700">All Shapes ({shapes.length})</h4>
            {shapes.length === 0 ? (
              <div className="text-xs text-gray-500 italic">No shapes created yet</div>
            ) : (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {shapes.map((shape) => (
                  <button
                    key={shape.id}
                    onClick={() => handleShapeSelect(shape.id)}
                    className={`w-full text-left p-2 rounded text-xs transition-colors ${
                      selectedShapeId === shape.id
                        ? 'bg-blue-100 border border-blue-300 text-blue-800'
                        : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ 
                          backgroundColor: shape.fill,
                          borderColor: selectedShapeId === shape.id ? '#3b82f6' : '#d1d5db'
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          Rectangle {shapes.indexOf(shape) + 1}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {Math.round(shape.x)}, {Math.round(shape.y)} • {Math.round(shape.width)}×{Math.round(shape.height)}
                        </div>
                      </div>
                      {selectedShapeId === shape.id && (
                        <div className="text-blue-600">✓</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Rectangle Properties - Vertical Layout */}
          {selectedShapeId && (
            <div className="space-y-3">
              <RectangleProperties selectedShapeId={selectedShapeId} />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Users Section */}
      <CollapsibleSection title="Online Users" defaultOpen={true}>
        <div className="space-y-2">
          {(() => {
            // Filter users who have cursors (are actively using the canvas)
            const activeUsers = presenceUsers.filter(user => getUserCursor(user.userId))
            
            if (activeUsers.length === 0) {
              return (
                <div className="text-gray-500 text-sm p-2">
                  No other users online
                </div>
              )
            }
            
            return activeUsers.map((user) => {
              const userCursor = getUserCursor(user.userId)
              const isExpanded = expandedUser === user.userId
              
              return (
                <div key={user.userId} className="space-y-1">
                  <button
                    onClick={() => handleUserClick(user.userId)}
                    className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 border border-blue-200"
                  >
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: user.color }}
                    />
                    <span className="text-sm text-gray-700 flex-1 text-left">{user.userName}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                  </button>
                
                {/* Cursor Information */}
                {isExpanded && userCursor && (
                  <div className="ml-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs space-y-2">
                    <div className="text-blue-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Position:</span>
                        <span className="font-mono">({Math.round(userCursor.x)}, {Math.round(userCursor.y)})</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Color:</span>
                        <div className="flex items-center gap-1">
                          <div 
                            className="w-3 h-3 rounded border"
                            style={{ backgroundColor: userCursor.color }}
                          />
                          <span className="font-mono text-xs">{userCursor.color}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Last Updated:</span>
                        <span>{new Date(userCursor.lastUpdated).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>In Viewport:</span>
                        <span className={userCursor.isVisible ? 'text-green-600' : 'text-red-600'}>
                          {userCursor.isVisible ? '✓ Visible' : '✗ Outside'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                </div>
              )
            })
          })()}
        </div>
      </CollapsibleSection>

      {/* Debug Section */}
      <CollapsibleSection title="Debug" defaultOpen={true}>
        <div className="space-y-3">
          {/* Self Cursor Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Show Self Cursor</label>
            <button
              onClick={() => setShowSelfCursor(!showSelfCursor)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showSelfCursor ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showSelfCursor ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Debug Info Display - always shown */}
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-2">
            <div className="font-medium text-gray-800">Debug Information</div>
            <div className="text-gray-600 space-y-1">
              <div className="flex justify-between">
                <span>Total Users:</span>
                <span>{presenceUsers.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span>{presenceUsers.filter(user => getUserCursor(user.userId)).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Active Cursors:</span>
                <span>{cursors.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Canvas Scale:</span>
                <span>{(stageScale * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Canvas Position:</span>
                <span className="font-mono">({Math.round(stagePosition.x)}, {Math.round(stagePosition.y)})</span>
              </div>
              <div className="flex justify-between">
                <span>Viewport Size:</span>
                <span className="font-mono">{viewportWidth}×{viewportHeight}</span>
              </div>
              <div className="flex justify-between">
                <span>Effective Canvas Size:</span>
                <span className="font-mono">{Math.round(viewportWidth / stageScale)}×{Math.round(viewportHeight / stageScale)}</span>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* User Account Section */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 flex-1">
            {user?.photoURL && (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User'}
                className="w-8 h-8 rounded-full"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900 truncate">
                {user?.displayName || user?.email || 'User'}
              </div>
              <div className="text-xs text-gray-500">
                {user?.email && user?.displayName ? user.email : 'Logged in'}
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="px-3 py-1.5 bg-red-500 text-white text-sm rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default LeftColumn
