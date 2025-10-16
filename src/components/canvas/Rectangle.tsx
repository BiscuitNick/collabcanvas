import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Rect, Transformer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { Rectangle } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS, ENABLE_PERFORMANCE_LOGGING } from '../../lib/config'

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
}) => {
  const rectRef = useRef<Konva.Rect>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId
  // const isLockedByCurrent = shape.lockedByUserId === currentUserId
  
  // Debug: Log lock color info
  if (isLockedByOther) {
    console.log('🎨 Locked shape color:', {
      shapeId: shape.id,
      lockedByUserId: shape.lockedByUserId,
      lockedByUserName: shape.lockedByUserName,
      lockedByUserColor: shape.lockedByUserColor,
      currentUserId
    })
  }

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
        const startTime = ENABLE_PERFORMANCE_LOGGING ? performance.now() : 0
        
        // Clamp position within canvas bounds
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF, CANVAS_HALF - shape.width)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF, CANVAS_HALF - shape.height)
        
        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
        
        if (ENABLE_PERFORMANCE_LOGGING) {
          const duration = performance.now() - startTime
          console.log(`📦 Rectangle drag update took ${duration.toFixed(2)}ms`)
        }
      }
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onDragMove, shape.width, shape.height])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      try {
        transformerRef.current.nodes([rectRef.current])
        transformerRef.current.getLayer()?.batchDraw()
      } catch (error: unknown) {
        // Ignore errors in test environment
        console.warn('Transformer setup failed:', error)
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
    e.cancelBubble = true
    // Allow viewing details but not editing if locked by another user
    if (isLockedByOther) {
      console.log('👁️ Viewing locked shape details:', shape.lockedByUserName)
    }
    // Always call onSelect to show details in panel
    onSelect()
  }

  const handleDragStart = () => {
    // Only allow drag if shape is selected
    if (!isSelected) {
      console.log('❌ Cannot drag - shape must be selected first')
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
    
    // Clamp position within canvas bounds
    const clampedX = clamp(rectX, -CANVAS_HALF, CANVAS_HALF - shape.width)
    const clampedY = clamp(rectY, -CANVAS_HALF, CANVAS_HALF - shape.height)
    
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
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation ? node.rotation() : 0

    // Calculate new dimensions using current node dimensions
    const currentWidth = node.width() * node.scaleX()
    const currentHeight = node.height() * node.scaleY()
    const newWidth = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentWidth))
    const newHeight = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentHeight))

    // Calculate new position - use the current node position as Konva handles the transform
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF - newWidth)
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF - newHeight)

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
        rotation={shape.rotation}
        fill={shape.fill}
        stroke={isLockedByOther ? (shape.lockedByUserColor || '#FF0000') : (isSelected ? '#007AFF' : 'transparent')}
        strokeWidth={isLockedByOther ? Math.min(20, ((shape.width + shape.height) / 2) * 0.1) : (isSelected ? 2 : 0)}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
        draggable={isSelected && !isLockedByOther}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={isSelected && !isLockedByOther ? handleDragStart : undefined}
        onDragMove={isSelected && !isLockedByOther ? handleDragMove : undefined}
        onDragEnd={isSelected && !isLockedByOther ? handleDragEnd : undefined}
        onTransformStart={isSelected && !isLockedByOther ? handleTransformStart : undefined}
        onTransformEnd={isSelected && !isLockedByOther ? handleTransformEnd : undefined}
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
      {isSelected && !isLockedByOther && (
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
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
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
