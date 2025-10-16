import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useShapes } from '../hooks/useShapes'
import { useCursors } from '../hooks/useCursors'
import { usePresence } from '../hooks/usePresence'
import { useCanvasStore } from '../store/canvasStore'
import Layout from '../components/layout/Layout'
import LeftColumn from '../components/layout/LeftColumn'
import Canvas from '../components/canvas/Canvas'
import FPSMonitor from '../components/canvas/FPSMonitor'
import ErrorBoundary from '../components/ErrorBoundary'
import { CANVAS_HALF } from '../lib/constants'

export const CanvasPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [pendingUserClick, setPendingUserClick] = useState<string | null>(null)
  const [showSelfCursor, setShowSelfCursor] = useState(true)
  const [showFPS, setShowFPS] = useState(() => {
    // Load from localStorage, default to true
    const saved = localStorage.getItem('showFPS')
    return saved !== null ? JSON.parse(saved) : true
  })
  const [enableViewportCulling, setEnableViewportCulling] = useState(() => {
    // Load from localStorage, default to false
    const saved = localStorage.getItem('enableViewportCulling')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [visibleShapesCount, setVisibleShapesCount] = useState(0)

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
  } = useCursors(user?.uid || '', user?.displayName || 'Anonymous', stagePosition, canvasSize.width, canvasSize.height, stageScale)

  const {
    presenceUsers,
    error: presenceError
  } = usePresence(user?.uid || '', user?.displayName || 'Anonymous')

  // Handle user click - auto pan to cursor (zoom-aware)
  const handleUserClick = useCallback((userId: string) => {
    const userCursor = cursors.find(cursor => cursor.userId === userId)
    
    if (userCursor) {
      // Desired stage position to center the cursor at current scale
      const desiredX = (canvasSize.width / 2) - (userCursor.x * stageScale)
      const desiredY = (canvasSize.height / 2) - (userCursor.y * stageScale)

      // Clamp stage position to world bounds with scale
      const minStageX = canvasSize.width - (CANVAS_HALF * stageScale)
      const maxStageX = (CANVAS_HALF * stageScale)
      const minStageY = canvasSize.height - (CANVAS_HALF * stageScale)
      const maxStageY = (CANVAS_HALF * stageScale)

      const clampedX = Math.max(minStageX, Math.min(maxStageX, desiredX))
      const clampedY = Math.max(minStageY, Math.min(maxStageY, desiredY))
      
      updatePosition(clampedX, clampedY)
    } else {
      if (cursors.length === 0) {
        setPendingUserClick(userId)
      }
    }
  }, [cursors, canvasSize.width, canvasSize.height, stageScale, updatePosition])

  // Handle shape click - auto pan to rectangle center (zoom-aware)
  const handleShapeClick = useCallback((shapeId: string) => {
    const shape = shapes.find(s => s.id === shapeId)
    
    if (shape) {
      const centerX = shape.x + (shape.width / 2)
      const centerY = shape.y + (shape.height / 2)

      // Desired stage position to center the rectangle at current scale
      const desiredX = (canvasSize.width / 2) - (centerX * stageScale)
      const desiredY = (canvasSize.height / 2) - (centerY * stageScale)

      // Clamp stage position to world bounds with scale
      const minStageX = canvasSize.width - (CANVAS_HALF * stageScale)
      const maxStageX = (CANVAS_HALF * stageScale)
      const minStageY = canvasSize.height - (CANVAS_HALF * stageScale)
      const maxStageY = (CANVAS_HALF * stageScale)

      const clampedX = Math.max(minStageX, Math.min(maxStageX, desiredX))
      const clampedY = Math.max(minStageY, Math.min(maxStageY, desiredY))
      
      updatePosition(clampedX, clampedY)
    }
  }, [shapes, canvasSize.width, canvasSize.height, stageScale, updatePosition])

  // Calculate canvas size based on viewport (left column is fixed at 320px)
  useEffect(() => {
    const updateCanvasSize = () => {
      const leftColumnWidth = 320 // Fixed left column width
      const pagePadding = 40 // 20px padding on each side (total 40px)
      
      // Calculate available space for canvas
      const availableWidth = window.innerWidth - leftColumnWidth - pagePadding
      const availableHeight = window.innerHeight - pagePadding
      
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
  }, [cursors, pendingUserClick, handleUserClick])

  // Handle shape selection from the list
  const handleShapeSelect = (shapeId: string) => {
    selectShape(shapeId)
    // Also pan to the selected shape
    handleShapeClick(shapeId)
  }

  // Handle debug state changes from LeftColumn
  const handleDebugStateChange = (selfCursor: boolean, showFPS: boolean, enableViewportCulling: boolean) => {
    setShowSelfCursor(selfCursor)
    setShowFPS(showFPS)
    setEnableViewportCulling(enableViewportCulling)
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
            onDebugStateChange={handleDebugStateChange}
            visibleShapesCount={visibleShapesCount}
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
              onMouseMove={(x, y) => updateCursor(x, y)}
              showSelfCursor={showSelfCursor}
              currentUserId={user?.uid}
              enableViewportCulling={enableViewportCulling}
              onVisibleShapesChange={setVisibleShapesCount}
            />
          </div>
        </div>
        
        {/* FPS Monitor Overlay */}
        <FPSMonitor isEnabled={showFPS} />
      </Layout>
    </ErrorBoundary>
  )
}
