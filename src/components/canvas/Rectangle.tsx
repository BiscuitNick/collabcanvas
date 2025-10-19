import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Rect, Transformer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { Rectangle } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS, LOCK_INDICATOR_STROKE_WIDTH } from '../../lib/config'

interface RectangleProps {
  shape: Rectangle
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Rectangle>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null
  canEdit?: boolean
}

const RectangleComponent: React.FC<RectangleProps> = memo(({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  currentUserId,
  selectedTool,
  canEdit = true,
}) => {
  const rectRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId

  // Canvas bounds - 64000x64000 with center at (0,0) for infinite feel
  // Moved to src/lib/constants.ts

  // Throttled drag move function
  const throttledDragMove = useCallback((x: number, y: number) => {
    if (!onDragMove) return

    const now = Date.now()
    
    // Store the latest position for debouncing
    pendingUpdateRef.current = { x, y }
    
    // Clear existing timeout
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }

    // Debounce: only update after configured delay
    throttleTimeoutRef.current = setTimeout(() => {
      const pendingUpdate = pendingUpdateRef.current
      if (!pendingUpdate) return

      // Throttle: only update if enough time has passed since last update
      if (now - lastUpdateRef.current >= RECTANGLE_DRAG_THROTTLE_MS) {
        // Clamp position within canvas bounds (x,y is now the center)
        const halfWidth = shape.width / 2
        const halfHeight = shape.height / 2
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
      }
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onDragMove, shape.width, shape.height])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      try {
        transformerRef.current.nodes([rectRef.current])
        transformerRef.current.getLayer()?.batchDraw()
      } catch {
        // Silently fail transformer setup
      }
    }
  }, [isSelected])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
      pendingUpdateRef.current = null
    }
  }, [])

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Log shape click
    console.log('🖱️ Canvas clicked - Shape:', { type: 'rectangle', id: shape.id, x: shape.x.toFixed(2), y: shape.y.toFixed(2) })

    // Only allow selection with select, pan, or ai tools
    const allowSelection = selectedTool === 'select' || selectedTool === 'pan' || selectedTool === 'ai' || selectedTool === null

    if (!allowSelection) {
      // Don't stop propagation - let the tool action happen
      console.log('🔧 Tool active - passing click through to canvas')
      return
    }

    // Prevent selection if locked by another user
    if (isLockedByOther) {
      console.log('⚠️ Cannot select - locked by another user')
      // IMPORTANT: Must stop propagation to prevent canvas panning!
      e.cancelBubble = true
      e.evt.stopPropagation()
      return
    }

    // Prevent event from bubbling to stage for selection
    e.cancelBubble = true
    e.evt.stopPropagation()

    // Call onSelect to show details in panel
    onSelect()
  }

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Stop propagation on mousedown for locked shapes to prevent stage drag initiation
    if (isLockedByOther) {
      e.cancelBubble = true
      e.evt.stopPropagation()
      e.evt.stopImmediatePropagation?.()
    }
  }

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Prevent event from bubbling
    e.cancelBubble = true

    // Only allow drag if shape is selected
    if (!isSelected) {
      // Prevent the drag
      e.target.stopDrag()
      return
    }
    // Notify parent that dragging has started
    onDragStart()
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the rectangle
    const rectX = e.target.x()
    const rectY = e.target.y()
    
    // Use throttled drag move to update position in real-time
    throttledDragMove(rectX, rectY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the rectangle
    const rectX = e.target.x()
    const rectY = e.target.y()

    // Clamp position within canvas bounds (x,y is now the center)
    const halfWidth = shape.width / 2
    const halfHeight = shape.height / 2
    const clampedX = clamp(rectX, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
    const clampedY = clamp(rectY, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

    // Update position in store (React will handle the re-render)
    onDragEnd(clampedX, clampedY)

    // Removed as it is handled by the Canvas component directly

    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = () => {
    // Transform started - no locking needed
  }

  const handleTransformEnd = () => {
    if (!rectRef.current) return

    const node = rectRef.current
    const rotation = node.rotation ? node.rotation() : 0

    // Calculate new dimensions using current node dimensions
    const currentWidth = node.width() * node.scaleX()
    const currentHeight = node.height() * node.scaleY()
    const newWidth = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentWidth))
    const newHeight = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentHeight))

    // Calculate new position - use the current node position as Konva handles the transform
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds (x,y is now the center)
    const halfWidth = newWidth / 2
    const halfHeight = newHeight / 2
    const clampedX = clamp(newX, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
    const clampedY = clamp(newY, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((rotation % 360) + 360) % 360

    // Update shape in store
    onUpdate({
      x: clampedX,
      y: clampedY,
      width: newWidth,
      height: newHeight,
      rotation: normalizedRotation
    })

    // Removed as it is handled by the Canvas component directly

    // Reset scale and position
    node.scaleX(1)
    node.scaleY(1)
    node.width(newWidth)
    node.height(newHeight)
    node.x(clampedX)
    node.y(clampedY)
  }


  // Visual state - no locking logic needed

  return (
    <>
      <Rect
        ref={rectRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        offsetX={shape.width / 2}
        offsetY={shape.height / 2}
        rotation={shape.rotation}
        fill={shape.fill}
        stroke={isLockedByOther ? (shape.lockedByUserColor || '#FF0000') : (isSelected ? '#007AFF' : 'transparent')}
        strokeWidth={isLockedByOther ? LOCK_INDICATOR_STROKE_WIDTH : (isSelected ? 2 : 0)}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
        draggable={isSelected && !isLockedByOther && canEdit}
        onClick={handleClick}
        onTap={handleClick}
        onMouseDown={handleMouseDown}
        onDragStart={isSelected && !isLockedByOther && canEdit ? handleDragStart : undefined}
        onDragMove={isSelected && !isLockedByOther && canEdit ? handleDragMove : undefined}
        onDragEnd={isSelected && !isLockedByOther && canEdit ? handleDragEnd : undefined}
        onTransformStart={isSelected && !isLockedByOther && canEdit ? handleTransformStart : undefined}
        onTransformEnd={isSelected && !isLockedByOther && canEdit ? handleTransformEnd : undefined}
        // Hover effects
        onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = isLockedByOther ? 'not-allowed' : 'pointer'
            }
          } catch {
            // Ignore errors in test environment
          }
        }}
        onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = 'default'
            }
          } catch {
            // Ignore errors in test environment
          }
        }}
      />
      {isSelected && !isLockedByOther && canEdit && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < MIN_SHAPE_SIZE || newBox.height < MIN_SHAPE_SIZE) {
              return oldBox
            }
            if (newBox.width > MAX_SHAPE_SIZE || newBox.height > MAX_SHAPE_SIZE) {
              return oldBox
            }
            return newBox
          }}
          keepRatio={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'middle-left', 'middle-right']}
          anchorSize={8}
          anchorStroke="#007AFF"
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          borderStroke="#007AFF"
          borderStrokeWidth={2}
          borderDash={[5, 5]}
          rotateEnabled={true}
        />
      )}
    </>
  )
})

RectangleComponent.displayName = 'RectangleComponent'

export default RectangleComponent
