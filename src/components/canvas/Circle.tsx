import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Circle as KonvaCircle, Transformer, Group, Rect, Text as KonvaText } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { Circle } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS } from '../../lib/config'

interface LockInfo {
  userId: string
  userName: string
  lockedItemId: string | null
}

interface CircleProps {
  shape: Circle
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Circle>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
  canEdit?: boolean
  isLockedByOther?: boolean
  lockInfo?: LockInfo | null
}

const CircleComponent: React.FC<CircleProps> = memo(({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  currentUserId: _currentUserId,
  selectedTool: _selectedTool,
  canEdit = true,
  isLockedByOther = false,
  lockInfo: _lockInfo = null,
}) => {
  const circleRef = useRef<Konva.Circle>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  
  // Implement radius fallback
  const effectiveRadius = shape.radius || 50 // Fallback to 50 if radius is undefined/null

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
        // Clamp position within canvas bounds (x,y is the center for circles)
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF + effectiveRadius, CANVAS_HALF - effectiveRadius)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF + effectiveRadius, CANVAS_HALF - effectiveRadius)

        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
      }
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onDragMove, effectiveRadius])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && circleRef.current) {
      try {
        transformerRef.current.nodes([circleRef.current])
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
    console.log('🖱️ Canvas clicked - Shape:', { type: 'circle', id: shape.id, x: shape.x.toFixed(2), y: shape.y.toFixed(2) })

    // Prevent selection if locked by another user
    if (isLockedByOther) {
      console.log('⚠️ Cannot select - locked by another user')
      // IMPORTANT: Must stop propagation to prevent canvas panning!
      e.cancelBubble = true
      e.evt.stopPropagation()
      return
    }

    // Always allow selection when clicking on existing content
    // The shape handling hook will handle tool switching as needed

    // Prevent event from bubbling to stage
    e.cancelBubble = true
    e.evt.stopPropagation()

    // Call onSelect to trigger selection and potential tool switch
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

    // Set cursor to grabbing while dragging
    const container = e.target.getStage()?.container()
    if (container) {
      container.style.cursor = 'grabbing'
    }

    // Notify parent that dragging has started
    onDragStart()
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the circle
    const circleX = e.target.x()
    const circleY = e.target.y()
    
    // Use throttled drag move to update position in real-time
    throttledDragMove(circleX, circleY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the circle
    const circleX = e.target.x()
    const circleY = e.target.y()

    // Clamp position within canvas bounds (x,y is the center for circles)
    const clampedX = clamp(circleX, -CANVAS_HALF + effectiveRadius, CANVAS_HALF - effectiveRadius)
    const clampedY = clamp(circleY, -CANVAS_HALF + effectiveRadius, CANVAS_HALF - effectiveRadius)

    // Reset cursor after dragging ends
    const container = e.target.getStage()?.container()
    if (container) {
      container.style.cursor = 'grab'
    }

    // Update position in store (React will handle the re-render)
    onDragEnd(clampedX, clampedY)

    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = () => {
    // Transform started - no locking needed
  }

  const handleTransformEnd = () => {
    if (!circleRef.current) return

    const node = circleRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Calculate new radius using the average of scaleX and scaleY to maintain circular shape
    const averageScale = (scaleX + scaleY) / 2
    const currentRadius = node.radius() * averageScale
    const newRadius = Math.max(MIN_SHAPE_SIZE / 2, Math.min(MAX_SHAPE_SIZE / 2, currentRadius))

    // Calculate new position - use the current node position as Konva handles the transform
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds (x,y is the center for circles)
    const clampedX = clamp(newX, -CANVAS_HALF + newRadius, CANVAS_HALF - newRadius)
    const clampedY = clamp(newY, -CANVAS_HALF + newRadius, CANVAS_HALF - newRadius)

    // Update shape in store
    onUpdate({
      x: clampedX,
      y: clampedY,
      radius: newRadius
    })

    // Reset scale and position
    node.scaleX(1)
    node.scaleY(1)
    node.radius(newRadius)
    node.x(clampedX)
    node.y(clampedY)
  }

  return (
    <>
      <KonvaCircle
        ref={circleRef}
        x={shape.x}
        y={shape.y}
        radius={effectiveRadius}
        fill={shape.fill}
        stroke={shape.stroke || 'transparent'}
        strokeWidth={shape.strokeWidth || 0}
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
              // Show 'grab' cursor when hovering over selected content
              // Show 'not-allowed' if locked by another user
              // Otherwise show 'pointer'
              if (isLockedByOther) {
                container.style.cursor = 'not-allowed'
              } else if (isSelected) {
                container.style.cursor = 'grab'
              } else {
                container.style.cursor = 'pointer'
              }
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

      {/* Lock indicator - Centered tag with username and lock icon */}
      {isLockedByOther && _lockInfo?.userName && (
        <Group>
          {/* Background rounded rectangle */}
          <Rect
            x={shape.x - 60}
            y={shape.y - 12}
            width={120}
            height={24}
            fill="rgba(255, 68, 68, 0.95)"
            cornerRadius={12}
            shadowColor="black"
            shadowBlur={6}
            shadowOpacity={0.3}
            shadowOffsetY={2}
          />
          {/* Lock icon and username text */}
          <KonvaText
            x={shape.x - 55}
            y={shape.y - 8}
            text={`🔒 ${_lockInfo.userName}`}
            fontSize={13}
            fill="white"
            fontStyle="bold"
            align="center"
          />
        </Group>
      )}

      {isSelected && !isLockedByOther && canEdit && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize - use diameter for circle bounds checking
            const minDiameter = MIN_SHAPE_SIZE
            const maxDiameter = MAX_SHAPE_SIZE
            
            if (newBox.width < minDiameter || newBox.height < minDiameter) {
              return oldBox
            }
            if (newBox.width > maxDiameter || newBox.height > maxDiameter) {
              return oldBox
            }
            return newBox
          }}
          keepRatio={true} // Maintain circular shape
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
          anchorSize={8}
          anchorStroke="#007AFF"
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          borderStroke={isLockedByOther ? '#FF0000' : '#007AFF'}
          borderStrokeWidth={2}
          borderDash={[5, 5]}
          rotateEnabled={false} // No rotation for circles as per requirements
        />
      )}
    </>
  )
})

CircleComponent.displayName = 'CircleComponent'

export default CircleComponent
