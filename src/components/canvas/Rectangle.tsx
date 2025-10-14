import React, { useRef, useEffect } from 'react'
import { Rect, Transformer } from 'react-konva'
import type { Rectangle } from '../../types'
import { clamp } from '../../lib/utils'

interface RectangleProps {
  shape: Rectangle
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Rectangle>) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  startManipulation: (shapeId: string, userId: string) => Promise<boolean>
  endManipulation: (shapeId: string) => Promise<void>
  isManipulating: (shapeId: string) => boolean
  isLocked: (shapeId: string) => boolean
  getLockOwner: (shapeId: string) => string | null
  currentUserId: string
}

const RectangleComponent: React.FC<RectangleProps> = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  startManipulation,
  endManipulation,
  isManipulating,
  isLocked,
  getLockOwner,
  currentUserId
}) => {
  const rectRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  // Canvas bounds - 5000x5000 with center at (0,0)
  const CANVAS_SIZE = 5000
  const CANVAS_HALF = CANVAS_SIZE / 2
  const MIN_SIZE = 20
  const MAX_SIZE = 1000

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && rectRef.current) {
      try {
        transformerRef.current.nodes([rectRef.current])
        transformerRef.current.getLayer()?.batchDraw()
      } catch (error) {
        // Ignore errors in test environment
        console.warn('Transformer setup failed:', error)
      }
    }
  }, [isSelected])

  const handleClick = (e: any) => {
    e.cancelBubble = true
    onSelect()
  }

  const handleDragStart = async () => {
    // Check if shape is locked by another user
    if (isLocked(shape.id) && getLockOwner(shape.id) !== currentUserId) {
      console.log('Shape is locked by another user')
      return
    }

    // Start manipulation (acquire lock)
    const success = await startManipulation(shape.id, currentUserId)
    if (!success) {
      console.log('Failed to acquire lock')
      return
    }

    // Notify parent that dragging has started
    onDragStart()
  }

  const handleDragEnd = async (e: any) => {
    // Get the current position of the rectangle
    const rectX = e.target.x()
    const rectY = e.target.y()
    
    // Clamp position within canvas bounds
    const clampedX = clamp(rectX, -CANVAS_HALF, CANVAS_HALF - shape.width)
    const clampedY = clamp(rectY, -CANVAS_HALF, CANVAS_HALF - shape.height)
    
    // Update position in store (React will handle the re-render)
    onDragEnd(clampedX, clampedY)
    
    // Only end manipulation if we were actually manipulating
    if (isManipulating(shape.id)) {
      await endManipulation(shape.id)
    }
    
    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = async () => {
    // Check if shape is locked by another user
    if (isLocked(shape.id) && getLockOwner(shape.id) !== currentUserId) {
      console.log('Shape is locked by another user')
      return
    }

    // Start manipulation (acquire lock)
    const success = await startManipulation(shape.id, currentUserId)
    if (!success) {
      console.log('Failed to acquire lock')
      return
    }
  }

  const handleTransformEnd = async () => {
    if (!rectRef.current) return

    const node = rectRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Calculate new dimensions
    const newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, shape.width * scaleX))
    const newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, shape.height * scaleY))

    // Calculate new position (accounting for scaling)
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF - newWidth)
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF - newHeight)

    // Update shape in store
    onUpdate({
      x: clampedX,
      y: clampedY,
      width: newWidth,
      height: newHeight
    })

    // Reset scale and position
    node.scaleX(1)
    node.scaleY(1)
    node.x(clampedX)
    node.y(clampedY)

    // Only end manipulation if we were actually manipulating
    if (isManipulating(shape.id)) {
      await endManipulation(shape.id)
    }
  }

  // Determine visual state
  const isBeingManipulated = isManipulating(shape.id)
  const isLockedByOther = isLocked(shape.id) && getLockOwner(shape.id) !== currentUserId

  return (
    <>
      <Rect
        ref={rectRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={
          isLockedByOther ? '#FF6B6B' : // Red for locked by other
          isBeingManipulated ? '#4ECDC4' : // Teal for being manipulated
          isSelected ? '#007AFF' : // Blue for selected
          'transparent'
        }
        strokeWidth={
          isLockedByOther ? 3 :
          isBeingManipulated ? 3 :
          isSelected ? 2 : 0
        }
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
        draggable={!isLockedByOther}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformStart={handleTransformStart}
        onTransformEnd={handleTransformEnd}
        // Hover effects
        onMouseEnter={(e) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = 'pointer'
            }
          } catch (error) {
            // Ignore errors in test environment
          }
        }}
        onMouseLeave={(e) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = 'default'
            }
          } catch (error) {
            // Ignore errors in test environment
          }
        }}
      />
      {isSelected && !isLockedByOther && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit resize
            if (newBox.width < MIN_SIZE || newBox.height < MIN_SIZE) {
              return oldBox
            }
            if (newBox.width > MAX_SIZE || newBox.height > MAX_SIZE) {
              return oldBox
            }
            return newBox
          }}
          keepRatio={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right', 'top-center', 'bottom-center', 'left-center', 'right-center']}
          anchorSize={8}
          anchorStroke={isBeingManipulated ? "#4ECDC4" : "#007AFF"}
          anchorFill="#FFFFFF"
          anchorStrokeWidth={2}
          borderStroke={isBeingManipulated ? "#4ECDC4" : "#007AFF"}
          borderStrokeWidth={2}
          borderDash={[5, 5]}
        />
      )}
    </>
  )
}

export default RectangleComponent
