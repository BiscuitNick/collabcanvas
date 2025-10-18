import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useContent } from '../hooks/useContent'
import { useCursors } from '../hooks/useCursors'
import { usePresence } from '../hooks/usePresence'
import { useCanvasStore } from '../store/canvasStore'
import FullScreenLayout from '../components/layout/FullScreenLayout'
import Canvas from '../components/canvas/Canvas'
import ErrorBoundary from '../components/ErrorBoundary'
import { CANVAS_HALF } from '../lib/constants'

export const CanvasPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [pendingUserClick, setPendingUserClick] = useState<string | null>(null)
  const [showSelfCursor] = useState(true)
  const [enableViewportCulling] = useState(() => {
    // Load from localStorage, default to false
    const saved = localStorage.getItem('enableViewportCulling')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [, setVisibleContentCount] = useState(0)

  // Initialize hooks
  const {
    content,
    updateContent,
    loading: contentLoading,
    lockContent,
    unlockContent,
    startEditingContent,
    stopEditingContent
  } = useContent()
  
  // Legacy aliases for backward compatibility
  const updateShape = updateContent
  const lockShape = lockContent
  const unlockShape = unlockContent
  const startEditingShape = startEditingContent
  const stopEditingShape = stopEditingContent
  const setVisibleShapesCount = setVisibleContentCount

  const { stagePosition, stageScale, updatePosition } = useCanvasStore()
  
  const {
    cursors,
    updateCursor
  } = useCursors(user?.uid || '', user?.displayName || 'Anonymous', stagePosition, canvasSize.width, canvasSize.height, stageScale)

  const {
    presenceUsers
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



  if (authLoading || contentLoading) {
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
      <FullScreenLayout
        content={content}
        cursors={cursors}
        presence={presenceUsers}
        currentUserId={user?.uid || undefined}
        updateShape={updateShape}
        onMouseMove={(x, y) => updateCursor(x, y)}
        showSelfCursor={showSelfCursor}
        enableViewportCulling={enableViewportCulling}
        onVisibleShapesChange={setVisibleShapesCount}
        lockShape={lockShape}
        unlockShape={unlockShape}
        startEditingShape={startEditingShape}
        stopEditingShape={stopEditingShape}
      >
        <Canvas
          width={canvasSize.width}
          height={canvasSize.height}
          content={content}
          cursors={cursors}
          updateShape={updateShape}
          onMouseMove={(x, y) => updateCursor(x, y)}
          showSelfCursor={showSelfCursor}
          currentUserId={user?.uid}
          enableViewportCulling={enableViewportCulling}
          onVisibleShapesChange={setVisibleShapesCount}
          lockShape={lockShape}
          unlockShape={unlockShape}
          startEditingShape={startEditingShape}
          stopEditingShape={stopEditingShape}
        />
      </FullScreenLayout>
    </ErrorBoundary>
  )
}
