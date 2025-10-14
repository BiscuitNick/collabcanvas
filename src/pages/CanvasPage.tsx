import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useShapes } from '../hooks/useShapes'
import { useCursors } from '../hooks/useCursors'
import { usePresence } from '../hooks/usePresence'
import { useCanvasStore } from '../store/canvasStore'
import Layout from '../components/layout/Layout'
import LeftColumn from '../components/layout/LeftColumn'
import Canvas from '../components/canvas/Canvas'
import ErrorBoundary from '../components/ErrorBoundary'

export const CanvasPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [pendingUserClick, setPendingUserClick] = useState<string | null>(null)

  // Initialize hooks
  const {
    shapes,
    createShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    loading: shapesLoading,
    error: shapesError,
    retry: retryShapes
  } = useShapes()

  const { stagePosition, stageScale, updatePosition, selectShape } = useCanvasStore()
  
  const {
    cursors,
    updateCursor,
    error: cursorsError
  } = useCursors(user?.uid || '', user?.displayName || 'Anonymous', canvasSize.width, canvasSize.height, stagePosition, canvasSize.width, canvasSize.height, stageScale)

  const {
    presenceUsers,
    error: presenceError
  } = usePresence(user?.uid || '', user?.displayName || 'Anonymous')

  // Calculate canvas size based on viewport (left column is fixed at 320px)
  useEffect(() => {
    const updateCanvasSize = () => {
      const leftColumnWidth = 320 // Fixed left column width
      const padding = 40 // 20px padding on each side
      
      // Calculate available space for canvas
      const availableWidth = window.innerWidth - leftColumnWidth - padding
      const availableHeight = window.innerHeight - padding
      
      setCanvasSize({
        width: Math.max(400, availableWidth), // Minimum 400px width
        height: Math.max(300, availableHeight) // Minimum 300px height
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Handle pending user clicks when cursors become available
  useEffect(() => {
    if (pendingUserClick && cursors.length > 0) {
      handleUserClick(pendingUserClick)
      setPendingUserClick(null)
    }
  }, [cursors, pendingUserClick])

  // Handle user click - auto pan to cursor
  const handleUserClick = (userId: string) => {
    const userCursor = cursors.find(cursor => cursor.userId === userId)
    
    if (userCursor) {
      // Calculate stage position to center the cursor
      // Cursor coordinates are in original canvas space, so we can use them directly
      const centerX = -userCursor.x + canvasSize.width / 2
      const centerY = -userCursor.y + canvasSize.height / 2
      
      // Smooth pan to cursor location
      updatePosition(centerX, centerY)
    } else {
      // If no cursors are loaded yet, set up a retry mechanism
      if (cursors.length === 0) {
        setPendingUserClick(userId)
      }
    }
  }

  // Handle shape selection from the list
  const handleShapeSelect = (shapeId: string) => {
    selectShape(shapeId)
  }


  if (authLoading || shapesLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Loading canvas...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the canvas.</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <Layout 
        leftColumn={
          <LeftColumn
            viewportWidth={canvasSize.width}
            viewportHeight={canvasSize.height}
            createShape={createShape}
            deleteShape={deleteShape}
            clearAllShapes={clearAllShapes}
            shapesError={shapesError || cursorsError || presenceError}
            onRetry={retryShapes}
            presenceUsers={presenceUsers}
            cursors={cursors}
            shapes={shapes}
            onUserClick={handleUserClick}
            onShapeSelect={handleShapeSelect}
          />
        }
      >
        {/* Canvas Area - Takes remaining space */}
        <div className="flex-1 flex items-center justify-center p-5 bg-gray-100 min-w-0">
          <div 
            className="bg-white overflow-hidden"
            style={{
              width: canvasSize.width,
              height: canvasSize.height
            }}
          >
            <Canvas
              width={canvasSize.width}
              height={canvasSize.height}
              shapes={shapes}
              cursors={cursors}
              updateShape={updateShape}
              onMouseMove={(x, y, canvasWidth, canvasHeight) => updateCursor(x, y, canvasWidth, canvasHeight)}
            />
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
