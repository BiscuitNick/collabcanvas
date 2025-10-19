import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Bug, Users, Layers } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { Shape, Content, Cursor as CursorType, PresenceUser } from '../../types'
import { isGroupContent } from '../../types'
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
import { useCanEdit } from '../../contexts/CanvasContext'
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
  selectedTool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
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
  const canEdit = useCanEdit()
  const { selectShape, resetView, selectedContentId, updatePositionAnimated, stageScale, stagePosition } = useCanvasStore()

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
  const { createContent: createContentOriginal, createContentBatch: createContentBatchOriginal, updateContent, updateContentBatch, clearAllContent, deleteContent, bringToFront, sendToBack, moveUp, moveDown } = useContent()

  // Firestore state - must be defined before the wrappers that use it
  const [enableFirestore, setEnableFirestore] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    return stored ? JSON.parse(stored) : true;
  })

  // Group caching state for performance optimization
  const [enableGroupCaching, setEnableGroupCaching] = useState(() => {
    const stored = localStorage.getItem('enableGroupCaching');
    return stored ? JSON.parse(stored) : false;
  })

  // Wrap createContent to respect Firestore setting
  const createContent = useCallback(async (contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => {
    console.log('🔧 [FullScreenLayout] createContent wrapper called, enableFirestore:', enableFirestore)
    return createContentOriginal(contentData, !enableFirestore)
  }, [createContentOriginal, enableFirestore])

  // Wrap createContentBatch to respect Firestore setting
  const createContentBatch = useCallback(async (contentDataArray: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    console.log('🔧 [FullScreenLayout] createContentBatch wrapper called, enableFirestore:', enableFirestore)
    return createContentBatchOriginal(contentDataArray, !enableFirestore)
  }, [createContentBatchOriginal, enableFirestore])

  // Legacy aliases for backward compatibility
  const createShape = createContent
  const clearAllShapes = clearAllContent

  // Handle copying content with offset
  const handleCopyContent = useCallback((itemToCopy: Content) => {
    // Calculate new position - all content is now center-anchored
    // Simply offset to the right and down
    const offset = 50

    const newX = itemToCopy.x + offset
    const newY = itemToCopy.y + offset

    // Remove id, createdAt, updatedAt as they'll be generated
    const { id, createdAt, updatedAt, ...contentToCopy } = itemToCopy as any

    // If copying a group, regenerate all nested item IDs with proper naming convention
    if (isGroupContent(itemToCopy)) {
      const baseTimestamp = Date.now()
      const oldToNewIdMap: Record<string, string> = {}

      // Generate new IDs for all nested items
      itemToCopy.contentIds.forEach((oldId, index) => {
        const nestedItem = itemToCopy.contentData[oldId]
        if (nestedItem) {
          // Use same naming convention: {type}-{timestamp}-{random}
          const timestamp = baseTimestamp + index
          const randomSuffix = Math.random().toString(36).substr(2, 9)
          const newId = `${nestedItem.type}-${timestamp}-${randomSuffix}`
          oldToNewIdMap[oldId] = newId
        }
      })

      // Create new contentIds array with new IDs
      const newContentIds = itemToCopy.contentIds.map(oldId => oldToNewIdMap[oldId])

      // Create new contentData object with new IDs as keys
      const newContentData: any = {}
      Object.entries(itemToCopy.contentData).forEach(([oldId, nestedItem]) => {
        const newId = oldToNewIdMap[oldId]
        if (newId) {
          newContentData[newId] = {
            ...nestedItem,
            id: newId
          }
        }
      })

      createContent({
        ...contentToCopy,
        x: newX,
        y: newY,
        contentIds: newContentIds,
        contentData: newContentData
      })
    } else {
      // Not a group, just copy normally
      createContent({ ...contentToCopy, x: newX, y: newY })
    }
  }, [createContent])

  // Handle deleting content
  const handleDeleteContent = useCallback((contentId: string) => {
    deleteContent(contentId)
  }, [deleteContent])
  const [uiState, setUIState] = useState<UIState>({
    propertiesPaneVisible: true,
    gridlinesVisible: false,
    selectedShapeId: null,
    selectedTool: canEdit ? 'select' : 'pan',
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

  // Force pan tool for view-only users
  useEffect(() => {
    if (!canEdit && uiState.selectedTool !== 'pan') {
      setUIState(prev => ({ ...prev, selectedTool: 'pan' }))
    }
  }, [canEdit, uiState.selectedTool])

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

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [manualCanvasSize, setManualCanvasSize] = useState<{ width: number; height: number } | null>(null)
  const [textOptions, setTextOptions] = useState({ text: '', fontSize: 24, fontFamily: 'Arial' as const, fontStyle: 'normal' as const })
  const [imageUrl, setImageUrl] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const fpsRef = useRef({ frames: 0, lastTime: performance.now() })
  const gridPositionHandlerRef = useRef<((x: number, y: number) => void) | null>(null)
  const [lastEvent, setLastEvent] = useState<{
    type: 'mouse' | 'touch'
    x: number
    y: number
    canvasX?: number
    canvasY?: number
    target: string
    contentTarget?: string
    tool: string
    timestamp: number
  } | null>(null)

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

  // Track last mouse/touch event for debugging
  useEffect(() => {
    const getTargetDescription = (target: EventTarget | null): string => {
      if (!target || !(target instanceof Element)) return 'unknown'

      const element = target as HTMLElement

      // Check if it's a canvas element
      if (element.tagName === 'CANVAS') return 'canvas'

      // Check for specific UI elements
      if (element.closest('button')) {
        const button = element.closest('button')
        return `button: ${button?.getAttribute('title') || button?.textContent?.trim() || 'unnamed'}`
      }

      if (element.closest('input')) {
        const input = element.closest('input')
        return `input: ${input?.getAttribute('placeholder') || input?.getAttribute('type') || 'unnamed'}`
      }

      if (element.closest('[class*="toolbar"]') || element.closest('[class*="Toolbar"]')) {
        return 'toolbar'
      }

      if (element.closest('[class*="properties"]') || element.closest('[class*="Properties"]')) {
        return 'properties panel'
      }

      if (element.closest('[class*="debug"]') || element.closest('[class*="Debug"]')) {
        return 'debug widget'
      }

      // Return class name or tag name
      const className = element.className
      if (typeof className === 'string' && className) {
        return `${element.tagName.toLowerCase()}.${className.split(' ')[0]}`
      }

      return element.tagName.toLowerCase()
    }

    const handleClick = (e: MouseEvent | TouchEvent) => {
      const isTouch = e.type.startsWith('touch')
      const clientX = isTouch ? (e as TouchEvent).touches[0]?.clientX || (e as TouchEvent).changedTouches[0]?.clientX : (e as MouseEvent).clientX
      const clientY = isTouch ? (e as TouchEvent).touches[0]?.clientY || (e as TouchEvent).changedTouches[0]?.clientY : (e as MouseEvent).clientY

      // Calculate canvas coordinates if clicked on canvas
      let canvasX: number | undefined
      let canvasY: number | undefined

      const target = e.target
      if (target instanceof Element && target.tagName === 'CANVAS') {
        // Convert screen coordinates to canvas coordinates
        const rect = target.getBoundingClientRect()
        const screenX = clientX - rect.left
        const screenY = clientY - rect.top
        canvasX = Math.round((screenX - stagePosition.x) / stageScale)
        canvasY = Math.round((screenY - stagePosition.y) / stageScale)
      }

      // Get content target info
      const targetDesc = getTargetDescription(e.target)
      let contentTarget: string | undefined

      // If clicking on canvas, check what content was clicked
      if (targetDesc === 'canvas') {
        // Small delay to allow selection to update
        setTimeout(() => {
          const currentSelectedId = useCanvasStore.getState().selectedContentId
          if (currentSelectedId) {
            const clickedContent = content.find(c => c.id === currentSelectedId)
            if (clickedContent) {
              setLastEvent(prev => prev ? {
                ...prev,
                contentTarget: `${clickedContent.type} (${clickedContent.id.substring(0, 8)})`
              } : null)
            }
          } else {
            setLastEvent(prev => prev ? {
              ...prev,
              contentTarget: 'empty canvas'
            } : null)
          }
        }, 10)
      }

      setLastEvent({
        type: isTouch ? 'touch' : 'mouse',
        x: Math.round(clientX),
        y: Math.round(clientY),
        canvasX,
        canvasY,
        target: targetDesc,
        contentTarget,
        tool: uiState.selectedTool || 'none',
        timestamp: Date.now()
      })
    }

    // Listen for both mouse and touch events
    document.addEventListener('click', handleClick)
    document.addEventListener('touchend', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('touchend', handleClick)
    }
  }, [uiState.selectedTool, stagePosition, stageScale])

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
    updatePositionAnimated(desiredX, desiredY) // Use animated pan when clicking layers
  }, [canvasSize.width, canvasSize.height, stageScale, updatePositionAnimated])

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
  const handleToolSelect = useCallback((tool: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null) => {
    const isShapeTool = tool === 'rectangle' || tool === 'circle';
    const isTextTool = tool === 'text';
    const isImageTool = tool === 'image';
    setUIState(prev => ({
      ...prev,
      selectedTool: tool,
      isCreatingShape: isShapeTool || isTextTool || isImageTool,
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

  const handleToggleGroupCaching = useCallback((enable: boolean) => {
    setEnableGroupCaching(enable)
    localStorage.setItem('enableGroupCaching', JSON.stringify(enable))
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

  const handleImageUrlChange = useCallback((url: string) => {
    setImageUrl(url)
  }, [])

  const handleGridPositionHandlerRegistration = useCallback((handler: (x: number, y: number) => void) => {
    gridPositionHandlerRef.current = handler
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

        // Create content - wrapper handles Firestore setting
        await createContent(textContent)

        // TODO: Task 2.3 - Immediately enter edit mode with caret visible
      } catch {
        // Silently fail
      }
      return
    }

    // Handle image creation
    if (uiState.selectedTool === 'image') {
      try {
        const { createImageContent } = await import('../../lib/utils')

        if (!imageUrl.trim()) {
          // Don't create image if no URL provided
          return
        }

        const imageContent = createImageContent(
          event.x,
          event.y,
          user?.uid || 'anonymous',
          {
            src: imageUrl,
            width: 100,
            height: 100,
            alt: 'User image',
          }
        )

        // Create content - wrapper handles Firestore setting
        await createContent(imageContent)
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
          }
          await createShape(circle)
        }

      } catch {
        // ignore
      }
    }

    // Handle grid tool - update grid position when canvas is clicked
    if (gridPositionHandlerRef.current) {
      gridPositionHandlerRef.current(event.x, event.y)
    }
  }, [createShape, user?.uid, uiState, createContent, textOptions, imageUrl])



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
          isCreatingShape: uiState.isCreatingShape,
          enableGroupCaching: enableGroupCaching
        })}
      </div>

      {/* Floating Bottom Toolbar - Center */}
        <BottomToolbar
          onCreateShape={handleCreateShape}
          onCreateShapeWithOptions={handleCreateShapeWithOptions}
          onCreateContent={createContent}
          onCreateContentBatch={createContentBatch}
          onUpdateContent={updateShape}
          onUpdateContentBatch={updateContentBatch}
          onTextOptionsChange={handleTextOptionsChange}
          onImageUrlChange={handleImageUrlChange}
          onOpenAIAgent={handleOpenAIAgent}
          selectedTool={uiState.selectedTool}
          onToolSelect={handleToolSelect}
          onResetCanvas={handleResetCanvas}
          canEdit={canEdit}
          canvasViewport={{
            position: stagePosition,
            scale: stageScale,
            width: canvasSize.width,
            height: canvasSize.height
          }}
          onGridPositionClick={handleGridPositionHandlerRegistration}
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
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onMoveUp={moveUp}
          onMoveDown={moveDown}
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
        enableGroupCaching={enableGroupCaching}
        onToggleGroupCaching={handleToggleGroupCaching}
        canvasWidth={canvasSize.width}
        canvasHeight={canvasSize.height}
        onCanvasWidthChange={handleCanvasWidthChange}
        onCanvasHeightChange={handleCanvasHeightChange}
        onClose={() => setUIState(prev => ({ ...prev, debugMode: false }))}
        lastEvent={lastEvent}
      />
    </div>
  )
}

export default FullScreenLayout
