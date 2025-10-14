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
  onMouseMove?: (x: number, y: number) => void
}

const RectangleComponent: React.FC<RectangleProps> = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  onMouseMove
}) => {
  const rectRef = useRef<any>(null)
  const transformerRef = useRef<any>(null)

  // Canvas bounds - 64000x64000 with center at (0,0)
  const CANVAS_SIZE = 64000
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

  const handleDragStart = () => {
    // Notify parent that dragging has started
    onDragStart()
  }

  const handleDragEnd = (e: any) => {
    // Get the current position of the rectangle
    const rectX = e.target.x()
    const rectY = e.target.y()
    
    // Clamp position within canvas bounds
    const clampedX = clamp(rectX, -CANVAS_HALF, CANVAS_HALF - shape.width)
    const clampedY = clamp(rectY, -CANVAS_HALF, CANVAS_HALF - shape.height)
    
    // Update position in store (React will handle the re-render)
    onDragEnd(clampedX, clampedY)
    
    // Update cursor position with mouse position
    if (onMouseMove) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        onMouseMove(pointer.x, pointer.y)
      }
    }
    
    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = () => {
    // Transform started - no locking needed
  }

  const handleTransformEnd = (e: any) => {
    if (!rectRef.current) return

    const node = rectRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const rotation = node.rotation ? node.rotation() : 0

    // Calculate new dimensions
    const newWidth = Math.max(MIN_SIZE, Math.min(MAX_SIZE, shape.width * scaleX))
    const newHeight = Math.max(MIN_SIZE, Math.min(MAX_SIZE, shape.height * scaleY))

    // Calculate new position (accounting for scaling)
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

    // Update cursor position with mouse position
    if (onMouseMove) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        onMouseMove(pointer.x, pointer.y)
      }
    }

    // Reset scale and position
    node.scaleX(1)
    node.scaleY(1)
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
        stroke={isSelected ? '#007AFF' : 'transparent'}
        strokeWidth={isSelected ? 2 : 0}
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
        draggable={true}
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
      {isSelected && (
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
}

export default RectangleComponent
