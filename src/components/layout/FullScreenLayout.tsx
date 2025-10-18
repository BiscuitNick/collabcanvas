import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Bug, Users, Layers } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { Shape, Content, Cursor as CursorType, PresenceUser } from '../../types'
import type { CanvasProps } from '../canvas/Canvas'
import UserProfileButton from './UserProfileButton'
import PositionWidget from './PositionWidget'
import DraggablePropertiesPane from './DraggablePropertiesPane'
import BottomToolbar from './BottomToolbar'
import ToolButton from './ToolButton'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useCursorContext } from '../../hooks/useCursorContext'
import { useContent } from '../../hooks/useContent'
import { useAuth } from '../../hooks/useAuth'
import DraggableDebugWidget from './DraggableDebugWidget'
import OnlineUsersWidget from './OnlineUsersWidget'

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
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null
  aiAgentActive: boolean
  isDragging: boolean
  isPanning: boolean
  isResizing: boolean
  debugMode: boolean
  showOnlineUsers: boolean
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
  const { user } = useAuth()
  const { selectShape, resetView, selectedContentId, updatePosition, stageScale } = useCanvasStore()

  // Convert presence array to a Map for efficient user lookup
  const usersMap = React.useMemo(() => {
    const map = new Map<string, { displayName?: string; email?: string }>();
    presence.forEach(user => {
      map.set(user.userId, { displayName: user.userName, email: user.userName });
    });
    return map;
  }, [presence]);
  // Use selectedContentId directly instead of the getter selectedShapeId for proper reactivity
  const canvasSelectedShapeId = selectedContentId
  const { createContent, updateContent, clearAllContent, deleteContent } = useContent()

  // Legacy aliases for backward compatibility
  const createShape = createContent
  const clearAllShapes = clearAllContent

  // Handle copying content with offset
  const handleCopyContent = useCallback((itemToCopy: Content) => {
    // Calculate new position based on shape type
    let newX = itemToCopy.x
    let newY = itemToCopy.y
    let offset = 50 // Default offset for shapes without width

    // Handle different shape types
    if (itemToCopy.type === 'rectangle' && 'width' in itemToCopy && itemToCopy.width) {
      // Rectangle: move to the right by width + gap
      newX = itemToCopy.x + itemToCopy.width + 20
    } else if (itemToCopy.type === 'circle' && 'radius' in itemToCopy && itemToCopy.radius) {
      // Circle: move to the right by diameter (2 * radius) + gap
      newX = itemToCopy.x + (itemToCopy.radius * 2) + 20
    } else if (itemToCopy.type === 'text') {
      // Text: keep same X, move down by fontSize + gap
      const textItem = itemToCopy as any
      newY = itemToCopy.y + (textItem.fontSize || 16) + 20
      // X stays the same for text
    } else {
      // Default fallback: move to the right
      newX = itemToCopy.x + offset
    }

    // Remove id, createdAt, updatedAt as they'll be generated
    const { id, createdAt, updatedAt, ...contentToCopy } = itemToCopy as any
    createContent({ ...contentToCopy, x: newX, y: newY })
  }, [createContent, user])

  // Handle deleting content
  const handleDeleteContent = useCallback((contentId: string) => {
    deleteContent(contentId)
  }, [deleteContent])
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
    showOnlineUsers: false,
    showSelfCursor: false,
    showFPS: true,
    enableViewportCulling: false,
    fps: 0,
    shapeCreationOptions: undefined,
    isCreatingShape: false
  })

  // Track previous selection ID to detect when a new item is selected
  const prevSelectionRef = useRef<string | null>(null)

  // Sync canvas store selection with UI state and auto-open panel for new selections
  useEffect(() => {
    setUIState(prev => ({
      ...prev,
      selectedShapeId: canvasSelectedShapeId
    }))

    // Auto-open properties pane only when a NEW (different) content item is selected
    if (canvasSelectedShapeId && canvasSelectedShapeId !== prevSelectionRef.current && !uiState.propertiesPaneVisible) {
      setUIState(prev => ({
        ...prev,
        propertiesPaneVisible: true
      }))
    }

    // Update the previous selection reference
    prevSelectionRef.current = canvasSelectedShapeId
  }, [canvasSelectedShapeId])

  const [enableFirestore, setEnableFirestore] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    return stored ? JSON.parse(stored) : true;
  })
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [manualCanvasSize, setManualCanvasSize] = useState<{ width: number; height: number } | null>(null)
  const [textOptions, setTextOptions] = useState({ text: '', fontSize: 24, fontFamily: 'Arial' as const, fontStyle: 'normal' as const })
  const containerRef = useRef<HTMLDivElement>(null)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })

  // Calculate FPS
  useEffect(() => {
    let animationFrameId: number

    const updateFPS = () => {
      const now = performance.now()
      fpsRef.current.frames++

      // Update FPS every second
      if (now >= fpsRef.current.lastTime + 1000) {
        const fps = Math.round((fpsRef.current.frames * 1000) / (now - fpsRef.current.lastTime))
        setUIState(prev => ({ ...prev, fps }))
        fpsRef.current.frames = 0
        fpsRef.current.lastTime = now
      }

      animationFrameId = requestAnimationFrame(updateFPS)
    }

    animationFrameId = requestAnimationFrame(updateFPS)

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  // Apply cursor context based on selected tool and interaction state
  useCursorContext({
    selectedTool: uiState.selectedTool,
    isDragging: uiState.isDragging,
    isPanning: uiState.isPanning,
    isResizing: uiState.isResizing
  })

  // Calculate canvas size - full screen or manual
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current) return

    // If manual size is set, use that instead
    if (manualCanvasSize) {
      setCanvasSize(manualCanvasSize)
      return
    }

    const container = containerRef.current
    const containerRect = container.getBoundingClientRect()

    // Full screen canvas - no reserved space for UI elements
    setCanvasSize({
      width: containerRect.width,
      height: containerRect.height
    })
  }, [manualCanvasSize])

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

    // Track last interaction when selecting a shape
    if (user?.uid) {
      updateContent(shapeId, {
        lastInteractedBy: user.uid,
        lastInteractedAt: new Date()
      })
    }
  }, [selectShape, user?.uid, updateContent])

  // Close properties pane
  const closePropertiesPane = useCallback(() => {
    setUIState(prev => ({ 
      ...prev, 
      propertiesPaneVisible: false 
    }))
  }, [])

  // Pan canvas to a specific content position (center it on the viewport)
  const handlePanToContent = useCallback((x: number, y: number) => {
    // Only pan if canvas size is valid
    if (canvasSize.width === 0 || canvasSize.height === 0) return

    // Calculate stage position to center the content on the viewport
    // accounting for current zoom level
    const desiredX = (canvasSize.width / 2) - (x * stageScale)
    const desiredY = (canvasSize.height / 2) - (y * stageScale)
    updatePosition(desiredX, desiredY)
  }, [canvasSize.width, canvasSize.height, stageScale, updatePosition])

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
  const handleToolSelect = useCallback((tool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null) => {
    const isShapeTool = tool === 'rectangle' || tool === 'circle' || tool === 'image';
    const isTextTool = tool === 'text';
    setUIState(prev => ({
      ...prev,
      selectedTool: tool,
      isCreatingShape: isShapeTool || isTextTool,
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

  // Online users toggle handler
  const handleToggleOnlineUsers = useCallback(() => {
    setUIState(prev => ({
      ...prev,
      showOnlineUsers: !prev.showOnlineUsers
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

  const handleToggleFirestore = useCallback((enable: boolean) => {
    setEnableFirestore(enable)
    localStorage.setItem('enableFirestore', JSON.stringify(enable))
  }, [])

  const handleCanvasWidthChange = useCallback((width: number) => {
    setManualCanvasSize(prev => ({ width, height: prev?.height || canvasSize.height }))
  }, [canvasSize.height])

  const handleCanvasHeightChange = useCallback((height: number) => {
    setManualCanvasSize(prev => ({ width: prev?.width || canvasSize.width, height }))
  }, [canvasSize.width])

  const handleTextOptionsChange = useCallback((options: { text: string; fontSize: number; fontFamily: any; fontStyle: any }) => {
    setTextOptions(options)
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
    // Handle text creation
    if (uiState.selectedTool === 'text') {
      try {
        const { createTextContent } = await import('../../lib/utils')

        const textContent = createTextContent(
          event.x,
          event.y,
          user?.uid || 'anonymous',
          {
            text: textOptions.text,
            fontSize: textOptions.fontSize,
            fontFamily: textOptions.fontFamily,
            fontStyle: textOptions.fontStyle,
          }
        )

        // Create content - skipFirestore parameter controls whether to save to Firestore
        await createContent(textContent, !enableFirestore)

        // TODO: Task 2.3 - Immediately enter edit mode with caret visible
      } catch {
        // Silently fail
      }
      return
    }

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
          }
          await createShape(rectangle, !enableFirestore)
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
          }
          await createShape(circle, !enableFirestore)
        }

      } catch {
        // ignore
      }
    }
  }, [createShape, user?.uid, uiState, createContent, enableFirestore, textOptions])



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
          onCreateContent={createContent}
          onUpdateContent={updateShape}
          onTextOptionsChange={handleTextOptionsChange}
          onOpenAIAgent={handleOpenAIAgent}
          selectedTool={uiState.selectedTool}
          onToolSelect={handleToolSelect}
          onResetCanvas={handleResetCanvas}
        />

      {/* Tool Button - Bottom Left (Layers Panel) */}
      {!uiState.propertiesPaneVisible && (
        <div className="absolute bottom-4 left-4 z-50">
          <ToolButton
            onClick={reopenPropertiesPane}
            icon={<Layers className="h-5 w-5" />}
            title="Open Layers Panel"
          />
        </div>
      )}

      {/* Debug Button - Bottom Right */}
      <div className="absolute bottom-4 right-4 z-50">
        <ToolButton
          onClick={handleToggleDebug}
          icon={<Bug className="h-5 w-5" />}
          title={uiState.debugMode ? "Hide Debug" : "Show Debug"}
        />
      </div>

      {/* Floating Position Widget - Top Left */}
      <div className="absolute top-4 left-4 z-50">
        <PositionWidget />
      </div>

      {/* Top Right Controls - Users Icon and User Profile */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {/* Online Users Button - only show when online users is closed */}
        {!uiState.showOnlineUsers && (
          <ToolButton
            onClick={handleToggleOnlineUsers}
            icon={<Users className="h-5 w-5" />}
            title="Show Online Users"
          />
        )}
        {/* User Profile Button */}
        <UserProfileButton />
      </div>

      {/* Online Users Widget - Dropdown below user avatar */}
      {uiState.showOnlineUsers && (
        <div
          className="absolute z-50 w-80"
          style={{
            top: 'calc(1rem + 40px + 0.5rem)', // top-4 + avatar height + small gap
            right: '1rem',
            maxHeight: 'calc(100vh - (1rem + 40px + 0.5rem) - 1rem)'
          }}
        >
          <OnlineUsersWidget presence={presence} onClose={handleToggleOnlineUsers} />
        </div>
      )}

      {/* Floating Layers Panel - Left with scroll support */}
      <div
        className="absolute left-4 z-50"
        style={{
          top: 'calc(1rem + 40px + 1rem)', // top-4 + PositionWidget height + gap
          maxHeight: 'calc(100vh - (1rem + 40px + 1rem) - 1rem)', // viewport height - top offset - bottom padding
          height: 'calc(100vh - (1rem + 40px + 1rem) - 1rem)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <DraggablePropertiesPane
          content={content}
          selectedShape={selectedShape}
          onUpdateShape={updateContent}
          onSelectShape={handleShapeSelect}
          onPanToContent={handlePanToContent}
          isVisible={uiState.propertiesPaneVisible}
          onClose={closePropertiesPane}
          currentUserId={currentUserId}
          users={usersMap}
          onCopyContent={handleCopyContent}
          onDeleteContent={handleDeleteContent}
        />
      </div>

      {/* Draggable Debug Widget */}
      <DraggableDebugWidget
        content={content}
        cursors={cursors}
        selectedShapeId={uiState.selectedShapeId}
        debugMode={uiState.debugMode}
        showSelfCursor={uiState.showSelfCursor}
        onToggleSelfCursor={handleToggleSelfCursor}
        showFPS={uiState.showFPS}
        onToggleFPS={handleToggleFPS}
        enableViewportCulling={uiState.enableViewportCulling}
        onToggleViewportCulling={handleToggleViewportCulling}
        fps={uiState.fps}
        enableFirestore={enableFirestore}
        onToggleFirestore={handleToggleFirestore}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
        onCanvasWidthChange={handleCanvasWidthChange}
        onCanvasHeightChange={handleCanvasHeightChange}
        onClose={() => setUIState(prev => ({ ...prev, debugMode: false }))}
      />
    </div>
  )
}

export default FullScreenLayout
