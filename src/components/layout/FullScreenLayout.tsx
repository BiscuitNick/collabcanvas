import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Bug, Users, Layers } from 'lucide-react'
import { useCanvasStore } from '../../store/canvasStore'
import type { Shape, Content, Cursor as CursorType, PresenceUser } from '../../types'
import { isGroupContent, isTextContent, isRectangleContent, isCircleContent, isImageContent } from '../../types'
import type { CanvasProps } from '../canvas/Canvas'
import UserProfileButton from './UserProfileButton'
import PositionWidget from './PositionWidget'
import DraggablePropertiesPane from './DraggablePropertiesPane'
import BottomToolbar from './BottomToolbar'
import ToolButton from './ToolButton'
import { AgentChat, type AgentChatRef } from './AgentChat'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { useCursorContext } from '../../hooks/useCursorContext'
import { useContent } from '../../hooks/useContent'
import { useAuth } from '../../hooks/useAuth'
import { useCanEdit } from '../../contexts/CanvasContext'
import { callAITest } from '../../lib/aiApi'
import { buildGrid } from '../../lib/utils'
import { ContentType, ContentVersion, FontFamily, FontStyle } from '../../types'
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
  const { selectShape, resetView, selectedContentId, updatePositionAnimated, stageScale, stagePosition, isMovingContent } = useCanvasStore()

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
  const { createContent: createContentOriginal, createContentBatch: createContentBatchOriginal, updateContent, updateContentBatch, clearAllContent, deleteContent, bringToFront, sendToBack, moveUp, moveDown, setSelection } = useContent()

  // Firestore state - must be defined before the wrappers that use it
  const [enableFirestore, setEnableFirestore] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    return stored ? JSON.parse(stored) : true;
  })

  // RTDB state for real-time sync
  const [enableRTDB, setEnableRTDB] = useState(() => {
    const stored = localStorage.getItem('enableRTDB');
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
    // Calculate new position based on content type
    let newX = itemToCopy.x
    let newY = itemToCopy.y

    if (isTextContent(itemToCopy)) {
      // For text, offset by height in Y direction
      const height = itemToCopy.height || itemToCopy.fontSize || 24
      newY = itemToCopy.y + height
    } else if (isRectangleContent(itemToCopy) || isImageContent(itemToCopy) || isGroupContent(itemToCopy)) {
      // For rectangles, images, and groups, offset by width in X direction
      newX = itemToCopy.x + itemToCopy.width
    } else if (isCircleContent(itemToCopy)) {
      // For circles, offset by diameter (radius * 2) in X direction
      newX = itemToCopy.x + (itemToCopy.radius * 2)
    }

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
    propertiesPaneVisible: false, // Hidden by default on new canvas
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
  const [agentLoading, setAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [agentMode, setAgentMode] = useState<'content' | 'image'>('content')
  const [agentAiModel, setAgentAiModel] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-ai-model')
    return saved || 'gpt-4o-mini'
  })
  const [agentImageModel, setAgentImageModel] = useState(() => {
    const saved = localStorage.getItem('collabcanvas-image-model')
    return saved || 'seedream-4'
  })
  const agentChatRef = React.useRef<AgentChatRef>(null)
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

  // Track agent mode and selection changes to show mode confirmation messages
  const prevAgentModeRef = useRef<'content' | 'image'>(agentMode)
  const prevSelectedContentIdRef = useRef<string | null>(selectedContentId)
  const prevAgentToolActiveRef = useRef<boolean>(false)

  useEffect(() => {
    const isAgentToolActive = uiState.selectedTool === 'agent'
    const wasAgentToolActive = prevAgentToolActiveRef.current

    // Show initial mode message when agent tool becomes active
    if (isAgentToolActive && !wasAgentToolActive) {
      if (agentChatRef.current) {
        const hasSelection = !!selectedContentId
        agentChatRef.current.addModeChangeMessage(agentMode, hasSelection)
      }
    }

    // Show mode change messages when mode or selection changes (only when agent tool is active)
    if (isAgentToolActive) {
      const modeChanged = prevAgentModeRef.current !== agentMode
      const selectionChanged = prevSelectedContentIdRef.current !== selectedContentId
      const hasSelection = !!selectedContentId

      // Show message when mode changes or selection state changes (but not on initial activation, handled above)
      if (wasAgentToolActive && (modeChanged || selectionChanged)) {
        if (agentChatRef.current) {
          agentChatRef.current.addModeChangeMessage(agentMode, hasSelection)
        }
      }
    }

    prevAgentModeRef.current = agentMode
    prevSelectedContentIdRef.current = selectedContentId
    prevAgentToolActiveRef.current = isAgentToolActive
  }, [agentMode, selectedContentId, uiState.selectedTool])

  // Apply cursor context based on selected tool and interaction state
  useCursorContext({
    selectedTool: uiState.selectedTool,
    isDragging: uiState.isDragging,
    isPanning: uiState.isPanning,
    isResizing: uiState.isResizing,
    isMoving: isMovingContent
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
  const handleShapeSelect = useCallback(async (shapeId: string | null) => {
    setUIState(prev => ({ ...prev, selectedShapeId: shapeId }))
    selectShape(shapeId)

    // Use setSelection for RTDB-based selection and locking
    if (setSelection) {
      await setSelection(shapeId)
    }

    // Track last interaction when selecting a shape (not when deselecting)
    if (shapeId && user?.uid) {
      updateContent(shapeId, {
        lastInteractedBy: user.uid,
        lastInteractedAt: new Date()
      })
    }
  }, [selectShape, setSelection, user?.uid, updateContent])

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

  // Pan and zoom to show content, ensuring it takes at least 35% of viewport width
  // Only zooms if content is too small to see or too large to fit
  const handlePanAndZoomToContent = useCallback((x: number, y: number, width: number, height: number) => {
    // Only pan if canvas size is valid
    if (canvasSize.width === 0 || canvasSize.height === 0) return

    // Calculate current size of content in screen pixels
    const currentContentWidthOnScreen = width * stageScale
    const currentContentHeightOnScreen = height * stageScale

    // Calculate target size (35% of viewport width)
    const targetWidthRatio = 0.35
    const targetContentWidth = canvasSize.width * targetWidthRatio

    // Determine if we need to zoom
    let needsZoom = false
    let newScale = stageScale

    // Content is too small to see (less than 35% of viewport)
    if (currentContentWidthOnScreen < targetContentWidth) {
      needsZoom = true
      newScale = targetContentWidth / width
      console.log(`[Pan & Zoom] Content too small, zooming in from ${stageScale.toFixed(2)} to ${newScale.toFixed(2)}`)
    }
    // Content is too large to fit in viewport (larger than viewport)
    else if (currentContentWidthOnScreen > canvasSize.width || currentContentHeightOnScreen > canvasSize.height) {
      needsZoom = true
      // Calculate scale to fit content in viewport (with some padding)
      const scaleForWidth = (canvasSize.width * 0.9) / width
      const scaleForHeight = (canvasSize.height * 0.9) / height
      newScale = Math.min(scaleForWidth, scaleForHeight)
      console.log(`[Pan & Zoom] Content too large, zooming out from ${stageScale.toFixed(2)} to ${newScale.toFixed(2)}`)
    } else {
      console.log(`[Pan & Zoom] Content already fits well, no zoom needed (current: ${(currentContentWidthOnScreen / canvasSize.width * 100).toFixed(0)}% of viewport)`)
    }

    // Clamp scale between 0.05x (5%) and 3x (300%)
    const clampedScale = Math.max(0.05, Math.min(3, newScale))

    // Update scale only if needed
    if (needsZoom) {
      const { updateScale } = useCanvasStore.getState()
      updateScale(clampedScale)
    }

    // Calculate stage position to center the content on the viewport
    const finalScale = needsZoom ? clampedScale : stageScale
    const desiredX = (canvasSize.width / 2) - (x * finalScale)
    const desiredY = (canvasSize.height / 2) - (y * finalScale)
    updatePositionAnimated(desiredX, desiredY)

    console.log(`[Pan & Zoom] Content: ${width}x${height}, Final Scale: ${finalScale.toFixed(2)}, Position: ${x}, ${y}`)
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

  // Agent mode change handler
  const handleAgentModeChange = useCallback((mode: 'content' | 'image') => {
    setAgentMode(mode)
    // Show mode change message
    if (agentChatRef.current) {
      const hasSelection = !!selectedContentId
      agentChatRef.current.addModeChangeMessage(mode, hasSelection)
    }
  }, [selectedContentId])

  // Agent settings handlers
  const handleAgentAiModelChange = useCallback((model: string) => {
    setAgentAiModel(model)
    localStorage.setItem('collabcanvas-ai-model', model)
  }, [])

  const handleAgentImageModelChange = useCallback((model: string) => {
    setAgentImageModel(model)
    localStorage.setItem('collabcanvas-image-model', model)
  }, [])

  // Agent chat submit handler
  const handleAgentSubmit = useCallback(async (message: string) => {
    if (!message.trim() || agentLoading) return

    setAgentLoading(true)
    setAgentError(null)

    try {
      // Get selected content from canvas store
      const selectedContent = content.find(c => c.id === selectedContentId)
      const isEditing = !!selectedContent

      // Handle image generation mode
      if (agentMode === 'image') {
        const isEditingImage = isEditing && selectedContent?.type === ContentType.IMAGE

        console.log('[Agent Chat Image] Sending request:', {
          model: agentImageModel,
          prompt: message,
          isEditingImage
        })

        const { generateImage } = await import('../../lib/aiApi')
        const imageUrl = isEditingImage && 'src' in selectedContent ? selectedContent.src : undefined
        const response = await generateImage(message, agentImageModel as any, imageUrl)

        if (response.success && response.data) {
          const newImageUrl = response.data.imageUrl

          // Add success message to chat
          if (agentChatRef.current) {
            agentChatRef.current.addAgentMessage('Image generation complete!')
          }

          // Get viewport center for positioning
          const getViewportCenter = () => {
            if (canvasSize.width === 0 || canvasSize.height === 0) return { x: 100, y: 100 }
            const viewportCenterScreenX = canvasSize.width / 2
            const viewportCenterScreenY = canvasSize.height / 2
            const canvasX = (viewportCenterScreenX - stagePosition.x) / stageScale
            const canvasY = (viewportCenterScreenY - stagePosition.y) / stageScale
            return { x: canvasX, y: canvasY }
          }

          const viewportCenter = getViewportCenter()

          if (isEditingImage && 'src' in selectedContent) {
            // Keep old image, place new one adjacent
            const gap = 20
            const oldWidth = 'width' in selectedContent ? selectedContent.width : 512
            const newX = selectedContent.x + oldWidth + gap

            const newImageContent = {
              type: ContentType.IMAGE,
              version: ContentVersion.V2,
              x: newX,
              y: selectedContent.y,
              src: newImageUrl,
              width: 512,
              height: 512,
              alt: message.substring(0, 100),
              createdBy: user?.uid || 'anonymous'
            }

            await createContent(newImageContent)
            handlePanAndZoomToContent(newX, selectedContent.y, 512, 512)
          } else {
            // Create new image at viewport center
            const newImageContent = {
              type: ContentType.IMAGE,
              version: ContentVersion.V2,
              x: viewportCenter.x,
              y: viewportCenter.y,
              src: newImageUrl,
              width: 512,
              height: 512,
              alt: message.substring(0, 100),
              createdBy: user?.uid || 'anonymous'
            }

            await createContent(newImageContent)
            handlePanAndZoomToContent(viewportCenter.x, viewportCenter.y, 512, 512)
          }
        } else {
          const errorMessage = response.error || 'Failed to generate image'
          if (agentChatRef.current) {
            agentChatRef.current.addAgentMessage(errorMessage)
          }
          setAgentError(errorMessage)
        }
        setAgentLoading(false)
        return
      }

      // Handle content creation mode (always use Replicate)
      console.log('[Agent Chat] Sending request:', {
        provider: 'replicate',
        model: agentAiModel,
        prompt: message,
        isEditing
      })

      // Call AI backend
      const response = await callAITest(message, 'replicate', agentAiModel as any, selectedContent)

      console.log('[Agent Chat] Received response:', response)

      if (response.success && response.data) {
        const { commands, message: aiMessage } = response.data

        // Add AI message to chat
        if (aiMessage && agentChatRef.current) {
          agentChatRef.current.addAgentMessage(aiMessage)
        }

        // Process commands
        if (commands && commands.length > 0) {
          console.log('[Agent Chat] Processing', commands.length, 'commands')

          // Get viewport center for positioning new content
          const getViewportCenter = () => {
            if (canvasSize.width === 0 || canvasSize.height === 0) return { x: 100, y: 100 }
            const viewportCenterScreenX = canvasSize.width / 2
            const viewportCenterScreenY = canvasSize.height / 2
            const canvasX = (viewportCenterScreenX - stagePosition.x) / stageScale
            const canvasY = (viewportCenterScreenY - stagePosition.y) / stageScale
            return { x: canvasX, y: canvasY }
          }

          const viewportCenter = getViewportCenter()

          // Separate edit, create, and grid commands
          const editCommands = commands.filter((cmd: any) => cmd.action === 'edit')
          const createCommands = commands.filter((cmd: any) => cmd.action === 'create')
          const gridCommands = commands.filter((cmd: any) => cmd.action === 'grid')

          // Process edit commands
          const updatesToApply: Array<{ id: string; updates: Partial<Content> }> = []

          for (const command of editCommands) {
            const targetId = command.shapeId || selectedContent?.id
            if (!targetId) continue

            const updates: any = {}
            if (command.x !== undefined) updates.x = command.x
            if (command.y !== undefined) updates.y = command.y
            if (command.width !== undefined) updates.width = command.width
            if (command.height !== undefined) updates.height = command.height
            if (command.radius !== undefined) updates.radius = command.radius
            if (command.fill !== undefined) updates.fill = command.fill
            if (command.stroke !== undefined) updates.stroke = command.stroke
            if (command.strokeWidth !== undefined) updates.strokeWidth = command.strokeWidth
            if (command.rotation !== undefined) updates.rotation = command.rotation
            if (command.text !== undefined) updates.text = command.text
            if (command.fontSize !== undefined) updates.fontSize = command.fontSize
            if (command.fontFamily !== undefined) updates.fontFamily = command.fontFamily
            if (command.fontStyle !== undefined) updates.fontStyle = command.fontStyle

            const existingUpdate = updatesToApply.find(u => u.id === targetId)
            if (existingUpdate) {
              Object.assign(existingUpdate.updates, updates)
            } else {
              updatesToApply.push({ id: targetId, updates: updates as Partial<Content> })
            }
          }

          // Apply edits
          if (updatesToApply.length > 0) {
            if (updateContentBatch && updatesToApply.length > 1) {
              await updateContentBatch(updatesToApply)
            } else {
              for (const { id, updates } of updatesToApply) {
                await updateShape(id, updates)
              }
            }

            // Pan to edited content (don't zoom)
            if (updatesToApply.length > 0) {
              const firstUpdate = updatesToApply[0]
              const targetContent = content.find(c => c.id === firstUpdate.id)
              if (targetContent) {
                const panX = firstUpdate.updates.x ?? targetContent.x
                const panY = firstUpdate.updates.y ?? targetContent.y
                handlePanToContent(panX, panY)
              }
            }
          }

          // Process grid commands
          for (const gridCommand of gridCommands) {
            const gridOptions = {
              startX: viewportCenter.x,
              startY: viewportCenter.y,
              rows: gridCommand.rows || 5,
              cols: gridCommand.cols || 5,
              cellWidth: gridCommand.cellWidth || 100,
              cellHeight: gridCommand.cellHeight || 100,
              gap: gridCommand.gap || 10,
              colors: gridCommand.colors || 'random',
              stroke: gridCommand.stroke,
              strokeWidth: gridCommand.strokeWidth
            }

            console.log('[Agent Chat] Building grid:', gridOptions)
            const gridCells = buildGrid(gridOptions)

            // Convert grid cells to content items
            const baseTimestamp = Date.now()
            const nestedItems = gridCells
              .filter(cell => cell.type === 'rectangle')
              .map((cell, index) => {
                const timestamp = baseTimestamp + index
                const randomSuffix = Math.random().toString(36).substr(2, 9)
                const id = `rectangle-${timestamp}-${randomSuffix}`

                return {
                  id,
                  content: {
                    type: ContentType.RECTANGLE,
                    version: ContentVersion.V2,
                    id,
                    x: cell.x!,
                    y: cell.y!,
                    width: cell.width!,
                    height: cell.height!,
                    fill: cell.fill!,
                    stroke: cell.stroke || '#000000',
                    strokeWidth: cell.strokeWidth || 1,
                    rotation: 0,
                    createdBy: 'system',
                    createdAt: 0,
                    updatedAt: 0
                  }
                }
              })

            if (nestedItems.length > 0) {
              // Calculate bounds for the group
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

              for (const item of nestedItems) {
                const rect = item.content
                minX = Math.min(minX, rect.x)
                minY = Math.min(minY, rect.y)
                maxX = Math.max(maxX, rect.x + rect.width)
                maxY = Math.max(maxY, rect.y + rect.height)
              }

              const groupWidth = maxX - minX
              const groupHeight = maxY - minY
              const groupCenterX = minX + groupWidth / 2
              const groupCenterY = minY + groupHeight / 2

              // Adjust nested items to be relative to group center
              const adjustedNestedItems = nestedItems.map(item => ({
                ...item,
                content: {
                  ...item.content,
                  x: item.content.x - minX,
                  y: item.content.y - minY
                }
              }))

              const groupData = {
                type: ContentType.GROUP,
                version: ContentVersion.V2,
                x: groupCenterX,
                y: groupCenterY,
                width: groupWidth,
                height: groupHeight,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                createdBy: user?.uid || 'anonymous',
                contentIds: adjustedNestedItems.map(item => item.id),
                contentData: Object.fromEntries(
                  adjustedNestedItems.map(item => [item.id, item.content])
                )
              } as any

              await createContent(groupData)
              handlePanAndZoomToContent(groupCenterX, groupCenterY, groupWidth, groupHeight)
            }
          }

          // Process create commands
          const contentToCreate: any[] = []

          for (const command of createCommands) {
            if (command.type === 'rectangle') {
              if (typeof command.x === 'number' && typeof command.y === 'number' &&
                  typeof command.width === 'number' && typeof command.height === 'number' &&
                  typeof command.fill === 'string') {
                contentToCreate.push({
                  type: ContentType.RECTANGLE,
                  version: ContentVersion.V2,
                  x: command.x + viewportCenter.x,
                  y: command.y + viewportCenter.y,
                  width: command.width,
                  height: command.height,
                  rotation: command.rotation || 0,
                  fill: command.fill,
                  stroke: command.stroke || '#000000',
                  strokeWidth: command.strokeWidth || 1
                })
              }
            } else if (command.type === 'circle') {
              if (typeof command.x === 'number' && typeof command.y === 'number' &&
                  (typeof command.width === 'number' || typeof command.radius === 'number') &&
                  typeof command.fill === 'string') {
                const radius = command.radius || ((command.width || 0) / 2)
                contentToCreate.push({
                  type: ContentType.CIRCLE,
                  version: ContentVersion.V2,
                  x: command.x + viewportCenter.x,
                  y: command.y + viewportCenter.y,
                  radius: radius,
                  fill: command.fill,
                  stroke: command.stroke || '#000000',
                  strokeWidth: command.strokeWidth || 1
                })
              }
            } else if (command.type === 'text') {
              if (typeof command.x === 'number' && typeof command.y === 'number' &&
                  typeof command.text === 'string') {
                const textContent: any = {
                  type: ContentType.TEXT,
                  version: ContentVersion.V2,
                  x: command.x + viewportCenter.x,
                  y: command.y + viewportCenter.y,
                  text: command.text,
                  fontSize: command.fontSize || 16,
                  fontFamily: (command.fontFamily as FontFamily) || FontFamily.ARIAL,
                  fontStyle: (command.fontStyle as FontStyle) || FontStyle.NORMAL,
                  fill: command.fill || '#000000'
                }
                if (typeof command.width === 'number') textContent.width = command.width
                if (typeof command.height === 'number') textContent.height = command.height
                contentToCreate.push(textContent)
              }
            }
          }

          // Create content with pan and zoom
          if (contentToCreate.length > 0) {
            if (contentToCreate.length > 1) {
              // Create as group
              let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

              for (const item of contentToCreate) {
                const itemMinX = item.x - (item.width || item.radius || 0) / 2
                const itemMinY = item.y - (item.height || item.radius || 0) / 2
                const itemMaxX = item.x + (item.width || item.radius || 0) / 2
                const itemMaxY = item.y + (item.height || item.radius || 0) / 2

                minX = Math.min(minX, itemMinX)
                minY = Math.min(minY, itemMinY)
                maxX = Math.max(maxX, itemMaxX)
                maxY = Math.max(maxY, itemMaxY)
              }

              const groupWidth = maxX - minX
              const groupHeight = maxY - minY
              const groupCenterX = (minX + maxX) / 2
              const groupCenterY = (minY + maxY) / 2

              const nestedItems = contentToCreate.map((item, index) => {
                const id = `agent-item-${Date.now()}-${index}`
                return {
                  id,
                  content: {
                    ...item,
                    id,
                    x: item.x - minX,
                    y: item.y - minY,
                    createdBy: 'system',
                    createdAt: 0,
                    updatedAt: 0
                  }
                }
              })

              const groupData = {
                type: ContentType.GROUP,
                version: ContentVersion.V2,
                x: groupCenterX,
                y: groupCenterY,
                width: groupWidth,
                height: groupHeight,
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                createdBy: user?.uid || 'anonymous',
                contentIds: nestedItems.map(item => item.id),
                contentData: Object.fromEntries(
                  nestedItems.map(item => [item.id, item.content])
                )
              } as any

              await createContent(groupData)
              handlePanAndZoomToContent(groupCenterX, groupCenterY, groupWidth, groupHeight)
            } else if (createContentBatch) {
              await createContentBatch(contentToCreate)
              const firstItem = contentToCreate[0]
              const itemWidth = firstItem.width || firstItem.radius * 2 || 100
              const itemHeight = firstItem.height || firstItem.radius * 2 || 100
              handlePanAndZoomToContent(firstItem.x, firstItem.y, itemWidth, itemHeight)
            } else {
              for (const contentData of contentToCreate) {
                await createContent(contentData)
              }
              const firstItem = contentToCreate[0]
              const itemWidth = firstItem.width || firstItem.radius * 2 || 100
              const itemHeight = firstItem.height || firstItem.radius * 2 || 100
              handlePanAndZoomToContent(firstItem.x, firstItem.y, itemWidth, itemHeight)
            }
          }
        }
      } else {
        // Error case - add error message to chat
        const errorMessage = response.error || 'Failed to process request'
        if (agentChatRef.current) {
          agentChatRef.current.addAgentMessage(errorMessage)
        }
        setAgentError(errorMessage)
      }
    } catch (error) {
      console.error('[Agent Chat] Error:', error)
      const errorMessage = 'An error occurred while processing your request'
      if (agentChatRef.current) {
        agentChatRef.current.addAgentMessage(errorMessage)
      }
      setAgentError(errorMessage)
    } finally {
      setAgentLoading(false)
    }
  }, [agentLoading, agentMode, agentAiModel, agentImageModel, content, selectedContentId, canvasSize, stagePosition, stageScale,
      createContent, createContentBatch, updateShape, updateContentBatch,
      handlePanToContent, handlePanAndZoomToContent, user])


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
      // Don't automatically open properties pane when toggling debug
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
    console.log(`🔧 [FullScreenLayout] Firestore ${enable ? 'enabled' : 'disabled'}`)
  }, [])

  const handleToggleRTDB = useCallback((enable: boolean) => {
    setEnableRTDB(enable)
    localStorage.setItem('enableRTDB', JSON.stringify(enable))
    console.log(`🔧 [FullScreenLayout] RTDB ${enable ? 'enabled' : 'disabled'}`)
    // Reload page to reinitialize RTDB listeners
    window.location.reload()
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
  }, [createShape, user?.uid, uiState, createContent, textOptions])



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
          onOpenAIAgent={handleOpenAIAgent}
          selectedTool={uiState.selectedTool}
          onToolSelect={handleToolSelect}
          onResetCanvas={handleResetCanvas}
          onCopyContent={handleCopyContent}
          onDeleteContent={handleDeleteContent}
          canEdit={canEdit}
          canvasViewport={{
            position: stagePosition,
            scale: stageScale,
            width: canvasSize.width,
            height: canvasSize.height
          }}
          onGridPositionClick={handleGridPositionHandlerRegistration}
          onPanToContent={handlePanToContent}
          onPanAndZoomToContent={handlePanAndZoomToContent}
        />

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

      {/* Tool Button - Below Position Widget (Layers Panel) */}
      {!uiState.propertiesPaneVisible && (
        <div className="absolute left-4 z-50" style={{ top: 'calc(1rem + 40px + 1rem)' }}>
          <ToolButton
            onClick={reopenPropertiesPane}
            icon={<Layers className="h-5 w-5" />}
            title="Open Layers Panel"
          />
        </div>
      )}

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
          height: 'calc(50vh - (1rem + 40px + 1rem) - 0.5rem)', // Take top 50% of vertical space
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

      {/* Agent Chat - Left side, bottom 50% - Only shown when agent tool is selected */}
      {uiState.selectedTool === 'agent' && (
        <div
          className="absolute left-4 z-50 w-80"
          style={{
            bottom: '1rem',
            height: 'calc(50vh - 1rem)',
          }}
        >
          <AgentChat
            ref={agentChatRef}
            onSubmit={handleAgentSubmit}
            isLoading={agentLoading}
            error={agentError}
            mode={agentMode}
            hasSelectedContent={!!selectedContentId}
            onModeChange={handleAgentModeChange}
            aiModel={agentAiModel}
            onAiModelChange={handleAgentAiModelChange}
            imageModel={agentImageModel}
            onImageModelChange={handleAgentImageModelChange}
          />
        </div>
      )}

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
        enableRTDB={enableRTDB}
        onToggleRTDB={handleToggleRTDB}
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
