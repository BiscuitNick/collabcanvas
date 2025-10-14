import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useShapes } from '../hooks/useShapes'
import { useCursors } from '../hooks/useCursors'
import { usePresence } from '../hooks/usePresence'
import { useCanvasStore } from '../store/canvasStore'
import Layout from '../components/layout/Layout'
import Canvas from '../components/canvas/Canvas'
import CanvasControls from '../components/canvas/CanvasControls'
import CursorLayer from '../components/multiplayer/CursorLayer'
import Sidebar from '../components/layout/Sidebar'
import PresenceList from '../components/multiplayer/PresenceList'
import ErrorBoundary from '../components/ErrorBoundary'

export const CanvasPage: React.FC = () => {
  const { user, loading: authLoading } = useAuth()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const { stagePosition } = useCanvasStore()
  
  const {
    cursors,
    updateCursor,
    error: cursorsError
  } = useCursors(user?.uid || '', user?.displayName || 'Anonymous', canvasSize.width, canvasSize.height, stagePosition)

  const {
    presenceUsers,
    error: presenceError
  } = usePresence(user?.uid || '', user?.displayName || 'Anonymous')


  // Calculate canvas size based on viewport and sidebar state
  useEffect(() => {
    const updateCanvasSize = () => {
      const headerHeight = 80 // Approximate header height
      const controlsHeight = 120 // Approximate controls height
      const padding = 40 // 20px padding on each side
      const sidebarWidth = sidebarOpen ? 320 : 0 // 300px sidebar + 20px margin
      
      // Calculate available space for canvas
      const availableWidth = window.innerWidth - sidebarWidth - padding
      const availableHeight = window.innerHeight - headerHeight - controlsHeight - padding
      
      setCanvasSize({
        width: Math.max(400, availableWidth), // Minimum 400px width
        height: Math.max(300, availableHeight) // Minimum 300px height
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [sidebarOpen])

  // Sidebar toggle handler
  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen)
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
      <Layout>
        <div className="flex-1 flex flex-col">
          {/* Canvas Controls - Full Width */}
          <CanvasControls 
            viewportWidth={canvasSize.width}
            viewportHeight={canvasSize.height}
            createShape={createShape}
            deleteShape={deleteShape}
            clearAllShapes={clearAllShapes}
            shapesError={shapesError || cursorsError || presenceError}
            onRetry={retryShapes}
            onSidebarToggle={handleSidebarToggle}
            sidebarOpen={sidebarOpen}
          />
          
          {/* Main Content Area - Side by Side Layout */}
          <div className="flex-1 flex">
            {/* Sidebar - Left Panel */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}>
              <PresenceList users={presenceUsers} />
            </Sidebar>
            
            {/* Canvas Area - Right Panel */}
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
                  updateShape={updateShape}
                  onMouseMove={(x, y, canvasWidth, canvasHeight) => updateCursor(x, y, canvasWidth, canvasHeight)}
                />
                <CursorLayer cursors={cursors} />
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  )
}
