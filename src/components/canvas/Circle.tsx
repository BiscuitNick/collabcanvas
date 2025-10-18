import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Circle as KonvaCircle, Transformer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { Circle } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS } from '../../lib/config'

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
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | null
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
  currentUserId,
  selectedTool,
}) => {
  const circleRef = useRef<Konva.Circle>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId
  
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
        // Clamp position within canvas bounds (using diameter for bounds checking)
        const diameter = effectiveRadius * 2
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF, CANVAS_HALF - diameter)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF, CANVAS_HALF - diameter)

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

    // Only allow selection with select, pan, or ai tools
    const allowSelection = selectedTool === 'select' || selectedTool === 'pan' || selectedTool === 'ai' || selectedTool === null

    if (!allowSelection) {
      // Don't stop propagation - let the tool action happen
      console.log('🔧 Tool active - passing click through to canvas')
      return
    }

    // Prevent event from bubbling to stage for selection
    e.cancelBubble = true
    e.evt.stopPropagation()

    // Prevent selection if locked by another user
    if (isLockedByOther) {
      console.log('⚠️ Cannot select - locked by another user')
      return
    }

    // Call onSelect to show details in panel
    onSelect()
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
    
    // Clamp position within canvas bounds (using diameter for bounds checking)
    const diameter = effectiveRadius * 2
    const clampedX = clamp(circleX, -CANVAS_HALF, CANVAS_HALF - diameter)
    const clampedY = clamp(circleY, -CANVAS_HALF, CANVAS_HALF - diameter)
    
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

    // Clamp position within canvas bounds (using diameter for bounds checking)
    const diameter = newRadius * 2
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF - diameter)
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF - diameter)

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
          borderStroke={isLockedByOther ? (shape.lockedByUserColor || '#FF0000') : '#007AFF'}
          borderStrokeWidth={isLockedByOther ? Math.min(20, shape.radius * 0.1) : 2}
          borderDash={[5, 5]}
          rotateEnabled={false} // No rotation for circles as per requirements
        />
      )}
    </>
  )
})

CircleComponent.displayName = 'CircleComponent'

export default CircleComponent
