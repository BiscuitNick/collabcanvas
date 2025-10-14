import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useShapes } from '../hooks/useShapes'
import { useShapeLocks } from '../hooks/useShapeLocks'
import Layout from '../components/layout/Layout'
import Canvas from '../components/canvas/Canvas'
import CanvasControls from '../components/canvas/CanvasControls'
import ErrorBoundary from '../components/ErrorBoundary'

export const CanvasPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Initialize hooks
  const {
    shapes,
    createShape,
    updateShape,
    deleteShape,
    loading: shapesLoading,
    error: shapesError,
    retry: retryShapes
  } = useShapes()

  const {
    startManipulation,
    endManipulation,
    isManipulating,
    isLocked,
    getLockOwner,
    releaseAllLocks,
    error: locksError
  } = useShapeLocks(user?.uid || '')

  // Calculate canvas size based on viewport
  useEffect(() => {
    const updateCanvasSize = () => {
      const padding = 40 // 20px padding on each side
      setCanvasSize({
        width: window.innerWidth - padding,
        height: window.innerHeight - 200 // Account for header and controls
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Clean up locks on unmount
  useEffect(() => {
    return () => {
      releaseAllLocks()
    }
  }, [releaseAllLocks])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        releaseAllLocks()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [releaseAllLocks])

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
      <Layout>
        <CanvasControls 
          viewportWidth={canvasSize.width}
          viewportHeight={canvasSize.height}
          createShape={createShape}
          updateShape={updateShape}
          deleteShape={deleteShape}
          startManipulation={startManipulation}
          endManipulation={endManipulation}
          isManipulating={isManipulating}
          shapesError={shapesError}
          locksError={locksError}
          onRetry={retryShapes}
        />
        <div className="flex-1 p-5">
          <Canvas
            width={canvasSize.width}
            height={canvasSize.height}
            shapes={shapes}
            updateShape={updateShape}
            startManipulation={startManipulation}
            endManipulation={endManipulation}
            isManipulating={isManipulating}
            isLocked={isLocked}
            getLockOwner={getLockOwner}
          />
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
