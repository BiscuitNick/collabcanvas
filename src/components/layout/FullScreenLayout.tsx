import React, { useState, useCallback, useRef, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvasStore'
import type { Shape, Content, Cursor as CursorType, PresenceUser } from '../../types'
import type { CanvasProps } from '../canvas/Canvas'
import ZoomWidget from './ZoomWidget'
import PositionWidget from './PositionWidget'
import DraggablePropertiesPane from './DraggablePropertiesPane'
import BottomToolbar from './BottomToolbar'
import ToolButton from './ToolButton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useCursorContext } from '../../hooks/useCursorContext'
import { useContent } from '../../hooks/useContent'
import { useAuth } from '../../hooks/useAuth'
import DraggableDebugWidget from './DraggableDebugWidget'

interface FullScreenLayoutProps {
  children: React.ReactNode
  content: Content[]
  cursors: CursorType[]
  presence: PresenceUser[]
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>
  onMouseMove: (x: number, y: number, canvasWidth: number, canvasHeight: number) => void
  showSelfCursor?: boolean
  currentUserId?: string
  enableViewportCulling?: boolean
  onVisibleShapesChange?: (visibleCount: number) => void
  lockShape?: (id: string) => Promise<void>
  unlockShape?: (id: string) => Promise<void>
  startEditingShape?: (id: string) => void
  stopEditingShape?: (id: string) => void
}

interface UIState {
  propertiesPaneVisible: boolean
  gridlinesVisible: boolean
  selectedShapeId: string | null
  selectedTool: 'select' | 'rectangle' | 'circle' | 'image' | 'ai' | 'pan' | null
  aiAgentActive: boolean
  isDragging: boolean
  isPanning: boolean
  isResizing: boolean
  debugMode: boolean
  showSelfCursor: boolean
  showFPS: boolean
  enableViewportCulling: boolean
  fps: number
  shapeCreationOptions?: {
    type: 'rectangle' | 'circle' | 'image'
    width?: number
    height?: number
    radius?: number
    fill: string
    stroke: string
    strokeWidth: number
  }
  isCreatingShape: boolean
}

const FullScreenLayout: React.FC<FullScreenLayoutProps> = ({
  children,
  content,
  cursors,
  presence,
  updateShape,
  onMouseMove,
  currentUserId,
  onVisibleShapesChange,
  lockShape,
  unlockShape,
  startEditingShape,
  stopEditingShape
}) => {
  useKeyboardShortcuts()
  const { selectShape, resetView } = useCanvasStore()
  const { createContent, clearAllContent } = useContent()
  
  // Legacy aliases for backward compatibility
  const createShape = createContent
  const clearAllShapes = clearAllContent
  const { user } = useAuth()
  const [uiState, setUIState] = useState<UIState>({
    propertiesPaneVisible: true,
    gridlinesVisible: false,
    selectedShapeId: null,
    selectedTool: 'select',
    aiAgentActive: false,
    isDragging: false,
    isPanning: false,
    isResizing: false,
    debugMode: false,
    showSelfCursor: false,
    showFPS: true,
    enableViewportCulling: false,
    fps: 0,
    shapeCreationOptions: undefined,
    isCreatingShape: false
  })

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Apply cursor context based on selected tool and interaction state
  useCursorContext({
    selectedTool: uiState.selectedTool,
    isDragging: uiState.isDragging,
    isPanning: uiState.isPanning,
    isResizing: uiState.isResizing
  })

  // Calculate canvas size - full screen
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()
    
    // Full screen canvas - no reserved space for UI elements
    setCanvasSize({
      width: containerRect.width,
      height: containerRect.height
    })
  }, [])

  useEffect(() => {
    calculateCanvasSize()
    
    const handleResize = () => calculateCanvasSize()
    window.addEventListener('resize', handleResize)
    
    return () => window.removeEventListener('resize', handleResize)
  }, [calculateCanvasSize])

  // Handle shape selection
  const handleShapeSelect = useCallback((shapeId: string) => {
    setUIState(prev => ({ ...prev, selectedShapeId: shapeId }))
    selectShape(shapeId)
  }, [selectShape])

  // Close properties pane
  const closePropertiesPane = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      propertiesPaneVisible: false 
    }))
  }, [])

  // Reopen properties pane
  const reopenPropertiesPane = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      propertiesPaneVisible: true 
    }))
  }, [])

  // Get selected shape
  const selectedShape = React.useMemo(() => {
    return content.find(s => s.id === uiState.selectedShapeId) || null
  }, [content, uiState.selectedShapeId])


  // Toolbar handlers
  const handleToolSelect = useCallback((tool: 'select' | 'rectangle' | 'circle' | 'image' | 'ai' | 'pan' | null) => {
    const isShapeTool = tool === 'rectangle' || tool === 'circle' || tool === 'image';
    setUIState(prev => ({
      ...prev,
      selectedTool: tool,
      isCreatingShape: isShapeTool,
      // Reset shape options if switching away from a shape tool
      shapeCreationOptions: isShapeTool ? prev.shapeCreationOptions : undefined
    }))
  }, [])

  const handleCreateShape = useCallback(async () => {
    // This function is now deprecated in favor of the new flow, but kept to avoid breaking changes if called elsewhere.
  }, [])

  const handleCreateShapeWithOptions = useCallback((options: {
    type: 'rectangle' | 'circle' | 'image'
    width?: number
    height?: number
    radius?: number
    fill: string
    stroke: string
    strokeWidth: number
  }) => {
    // Store shape creation options for canvas click
    setUIState(prev => ({ 
      ...prev, 
      shapeCreationOptions: options,
      isCreatingShape: true 
    }))
  }, [])

  const handleOpenAIAgent = useCallback(() => {
    setUIState(prev => ({ ...prev, aiAgentActive: !prev.aiAgentActive }))
  }, [])


  // Interaction state handlers
  const handleDragStart = useCallback(() => {
    setUIState(prev => ({ ...prev, isDragging: true }))
  }, [])

  const handleDragEnd = useCallback(() => {
    setUIState(prev => ({ ...prev, isDragging: false }))
  }, [])

  const handlePanStart = useCallback(() => {
    setUIState(prev => ({ ...prev, isPanning: true }))
  }, [])

  const handlePanEnd = useCallback(() => {
    setUIState(prev => ({ ...prev, isPanning: false }))
  }, [])

  // Debug toggle handler
  const handleToggleDebug = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      debugMode: !prev.debugMode,
      propertiesPaneVisible: !prev.debugMode ? true : prev.propertiesPaneVisible // Show properties pane when enabling debug
    }))
  }, [])

  // Debug control handlers
  const handleToggleSelfCursor = useCallback((show: boolean) => {
    setUIState(prev => ({ ...prev, showSelfCursor: show }))
  }, [])

  const handleToggleFPS = useCallback((show: boolean) => {
    setUIState(prev => ({ ...prev, showFPS: show }))
    localStorage.setItem('showFPS', JSON.stringify(show))
  }, [])

  const handleToggleViewportCulling = useCallback((enable: boolean) => {
    setUIState(prev => ({ ...prev, enableViewportCulling: enable }))
    localStorage.setItem('enableViewportCulling', JSON.stringify(enable))
  }, [])

  // Reset canvas - clear all shapes and recenter zoom/pan
  const handleResetCanvas = useCallback(async () => {
    try {
      await clearAllShapes() // This clears both local state and Firebase
      resetView() // This resets zoom and pan
      setUIState(prev => ({ 
        ...prev, 
        selectedShapeId: null,
        isCreatingShape: false,
        shapeCreationOptions: undefined
      }))
    } catch {
      // ignore
    }
  }, [clearAllShapes, resetView])

  // Handle canvas click for shape creation
  const handleCanvasClick = useCallback(async (event: { x: number; y: number }) => {
    if (uiState.isCreatingShape && uiState.shapeCreationOptions) {
      const { shapeCreationOptions } = uiState
      
      try {
        // Create shape at clicked position
        if (shapeCreationOptions.type === 'rectangle') {
          const rectangle = {
            type: 'rectangle' as const,
            version: 'v2' as const,
            x: event.x,
            y: event.y,
            width: shapeCreationOptions.width || 100,
            height: shapeCreationOptions.height || 60,
            fill: shapeCreationOptions.fill,
            stroke: shapeCreationOptions.stroke,
            strokeWidth: shapeCreationOptions.strokeWidth,
            rotation: 0,
            createdBy: user?.uid || 'anonymous',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await createShape(rectangle)
        } else if (shapeCreationOptions.type === 'circle') {
          let radius = shapeCreationOptions.radius
          if (radius === undefined) {
            if (shapeCreationOptions.width !== undefined && shapeCreationOptions.height !== undefined) {
              radius = (shapeCreationOptions.width + shapeCreationOptions.height) / 4
            } else if (shapeCreationOptions.width !== undefined) {
              radius = shapeCreationOptions.width / 2
            } else if (shapeCreationOptions.height !== undefined) {
              radius = shapeCreationOptions.height / 2
            }
          }

          const circle = {
            type: 'circle' as const,
            version: 'v2' as const,
            x: event.x,
            y: event.y,
            radius: radius !== undefined ? radius : 50,
            fill: shapeCreationOptions.fill,
            stroke: shapeCreationOptions.stroke,
            strokeWidth: shapeCreationOptions.strokeWidth,
            rotation: 0,
            createdBy: user?.uid || 'anonymous',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          await createShape(circle)
        }
        
      } catch {
        // ignore
      }
    }
  }, [createShape, user?.uid, uiState])



  return (
    <div 
      ref={containerRef}
      className="h-screen w-screen bg-white overflow-hidden relative"
    >
      {/* Full Screen Canvas */}
      <div 
        className="absolute inset-0"
        style={{
          width: canvasSize.width,
          height: canvasSize.height
        }}
      >
        {React.cloneElement(children as React.ReactElement<Partial<CanvasProps>>, {
          width: canvasSize.width,
          height: canvasSize.height,
          content,
          cursors,
          updateShape,
          onMouseMove,
          showSelfCursor: uiState.showSelfCursor,
          currentUserId,
          enableViewportCulling: uiState.enableViewportCulling,
          onVisibleShapesChange,
          lockShape,
          unlockShape,
          startEditingShape,
          stopEditingShape,
          onDragStart: handleDragStart,
          onDragEnd: handleDragEnd,
          onPanStart: handlePanStart,
          onPanEnd: handlePanEnd,
          selectedTool: uiState.selectedTool,
          onCanvasClick: handleCanvasClick,
          isCreatingShape: uiState.isCreatingShape
        })}
      </div>

      {/* Floating Bottom Toolbar - Center */}
        <BottomToolbar
          onCreateShape={handleCreateShape}
          onCreateShapeWithOptions={handleCreateShapeWithOptions}
          onOpenAIAgent={handleOpenAIAgent}
          selectedTool={uiState.selectedTool}
          onToolSelect={handleToolSelect}
          debugMode={uiState.debugMode}
          onToggleDebug={handleToggleDebug}
          onResetCanvas={handleResetCanvas}
        />

      {/* Tool Button - Bottom Left (Properties Panel) */}
      {!uiState.propertiesPaneVisible && (
        <div className="absolute bottom-4 left-4 z-50">
          <ToolButton
            onClick={reopenPropertiesPane}
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Open Properties Panel"
          />
        </div>
      )}

      {/* Floating Position Widget - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <PositionWidget />
      </div>

      {/* Floating Zoom Widget - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <ZoomWidget />
      </div>

      {/* Floating Layers Panel - Left with dynamic height */}
      <div 
        className="absolute left-4 z-50"
        style={{
          top: 'calc(1rem + 40px + 1rem)', // top-4 + PositionWidget height + gap
          bottom: '1rem' // bottom-4
        }}
      >
        <DraggablePropertiesPane
          content={content}
          selectedShape={selectedShape}
          onUpdateShape={updateShape}
          onSelectShape={handleShapeSelect}
          isVisible={uiState.propertiesPaneVisible}
          onClose={closePropertiesPane}
        />
      </div>


      {/* Draggable Debug Widget */}
      <DraggableDebugWidget
        content={content}
        cursors={cursors}
        presence={presence}
        selectedShapeId={uiState.selectedShapeId}
        debugMode={uiState.debugMode}
        showSelfCursor={uiState.showSelfCursor}
        onToggleSelfCursor={handleToggleSelfCursor}
        showFPS={uiState.showFPS}
        onToggleFPS={handleToggleFPS}
        enableViewportCulling={uiState.enableViewportCulling}
        onToggleViewportCulling={handleToggleViewportCulling}
        fps={uiState.fps}
        onClose={() => setUIState(prev => ({ ...prev, debugMode: false }))}
      />
    </div>
  )
}

export default FullScreenLayout
