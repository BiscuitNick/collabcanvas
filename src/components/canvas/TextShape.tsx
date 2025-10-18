import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Text, Transformer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { TextContent } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS, ENABLE_PERFORMANCE_LOGGING, LOCK_INDICATOR_STROKE_WIDTH } from '../../lib/config'

interface TextShapeProps {
  shape: TextContent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TextContent>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  onStartTextEditing?: (id: string, text: string) => void
  currentUserId?: string
}

const TextShapeComponent: React.FC<TextShapeProps> = memo(({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  onStartTextEditing,
  currentUserId,
}) => {
  const textRef = useRef<Konva.Text>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId

  // Throttled drag move function
  const throttledDragMove = useCallback((x: number, y: number) => {
    if (!onDragMove) return

    const now = Date.now()
    
    // Store the latest position for debouncing
    pendingUpdateRef.current = { x, y }
    
    // Throttle updates to prevent excessive calls
    if (now - lastUpdateRef.current < RECTANGLE_DRAG_THROTTLE_MS) {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
      
      throttleTimeoutRef.current = setTimeout(() => {
        if (pendingUpdateRef.current) {
          onDragMove(pendingUpdateRef.current.x, pendingUpdateRef.current.y)
          lastUpdateRef.current = Date.now()
        }
      }, RECTANGLE_DRAG_THROTTLE_MS)
      
      return
    }

    onDragMove(x, y)
    lastUpdateRef.current = now
  }, [onDragMove])

  // Debounced update function for final position
  const debouncedUpdate = useCallback((x: number, y: number) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }
    
    throttleTimeoutRef.current = setTimeout(() => {
      onUpdate({ x, y })
      onDragEndCallback()
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onUpdate, onDragEndCallback])

  // Handle drag start
  const handleDragStart = useCallback(() => {
    onDragStart()
  }, [onDragStart])

  // Handle drag move
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Text
    const newX = node.x()
    const newY = node.y()
    
    // Clamp position to canvas bounds
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF)
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF)
    
    // Update position immediately for smooth dragging
    node.x(clampedX)
    node.y(clampedY)
    
    // Throttle the callback
    throttledDragMove(clampedX, clampedY)
  }, [throttledDragMove])

  // Handle drag end
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target as Konva.Text
    const finalX = node.x()
    const finalY = node.y()
    
    // Clamp final position
    const clampedX = clamp(finalX, -CANVAS_HALF, CANVAS_HALF)
    const clampedY = clamp(finalY, -CANVAS_HALF, CANVAS_HALF)
    
    // Update position
    node.x(clampedX)
    node.y(clampedY)
    
    // Debounce the final update
    debouncedUpdate(clampedX, clampedY)
    
    onDragEnd(clampedX, clampedY)
  }, [debouncedUpdate, onDragEnd])

  // Handle click
  const handleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    onSelect()
  }, [onSelect])

  // Handle tap (for mobile)
  const handleTap = useCallback((e: Konva.KonvaEventObject<Event>) => {
    e.cancelBubble = true
    onSelect()
  }, [onSelect])

  // Handle double-click for text editing
  const handleDoubleClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    if (onStartTextEditing && !isLockedByOther) {
      onStartTextEditing(shape.id, shape.text)
    }
  }, [onStartTextEditing, shape.id, shape.text, isLockedByOther])

  // Handle transform
  const handleTransform = useCallback(() => {
    const node = textRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    
    // For text, we'll apply scaling to fontSize instead of width/height
    // This provides a more intuitive text resizing experience
    const baseFontSize = shape.fontSize
    const scaleFactor = Math.min(scaleX, scaleY) // Use the smaller scale to maintain aspect ratio
    
    // Calculate new font size based on scale
    const newFontSize = Math.max(8, Math.min(72, baseFontSize * scaleFactor))
    
    // Reset scale to 1
    node.scaleX(1)
    node.scaleY(1)
    
    // Update shape with new font size and position
    onUpdate({
      x: node.x(),
      y: node.y(),
      fontSize: newFontSize,
      rotation: node.rotation(),
    })
  }, [onUpdate, shape.fontSize])

  // Handle transform end
  const handleTransformEnd = useCallback(() => {
    const node = textRef.current
    if (!node) return

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)
    
    // Update position and rotation
    const x = node.x()
    const y = node.y()
    const rotation = node.rotation()
    
    onUpdate({ 
      x, 
      y, 
      rotation 
    })
    onDragEndCallback()
  }, [onUpdate, onDragEndCallback])

  // Set up transformer when selected
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      transformerRef.current.nodes([textRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [])

  // Performance logging
  useEffect(() => {
    if (ENABLE_PERFORMANCE_LOGGING) {
      console.log('TextShape rendered:', {
        id: shape.id,
        text: shape.text,
        fontSize: shape.fontSize,
        fontFamily: shape.fontFamily,
        fontStyle: shape.fontStyle,
        fill: shape.fill,
        isSelected,
        isLockedByOther
      })
    }
  }, [shape.id, shape.text, shape.fontSize, shape.fontFamily, shape.fontStyle, shape.fill, isSelected, isLockedByOther])

  // Determine text styling
  const getFontStyle = () => {
    if (shape.fontStyle.includes('italic')) return 'italic'
    return 'normal'
  }

  // Calculate text dimensions for bounding box
  const getTextDimensions = () => {
    // More accurate text measurement based on font size and content
    const charWidth = shape.fontSize * 0.6 // Approximate character width
    const lineHeight = shape.fontSize * 1.2 // Line height

    // Calculate width based on text length and font size
    const estimatedWidth = Math.max(shape.text.length * charWidth, shape.fontSize * 2)

    // Calculate height based on font size
    const estimatedHeight = lineHeight

    return {
      width: Math.max(estimatedWidth, 30), // Minimum width
      height: Math.max(estimatedHeight, 16) // Minimum height
    }
  }

  const textDimensions = getTextDimensions()

  return (
    <>
      <Text
        ref={textRef}
        x={shape.x}
        y={shape.y}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        fontStyle={getFontStyle()}
        fontVariant="normal"
        textDecoration=""
        fill={shape.fill}
        stroke={isLockedByOther ? (shape.lockedByUserColor || '#FF0000') : undefined}
        strokeWidth={isLockedByOther ? LOCK_INDICATOR_STROKE_WIDTH : 0}
        align={shape.textAlign || 'left'}
        verticalAlign={shape.verticalAlign || 'top'}
        width={textDimensions.width}
        height={textDimensions.height}
        draggable={isSelected && !isLockedByOther}
        onClick={handleClick}
        onTap={handleTap}
        onDblClick={handleDoubleClick}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        shadowColor={isSelected ? '#0066ff' : 'transparent'}
        shadowBlur={isSelected ? 4 : 0}
        shadowOffset={isSelected ? { x: 2, y: 2 } : { x: 0, y: 0 }}
        shadowOpacity={isSelected ? 0.3 : 0}
        scaleX={1}
        scaleY={1}
        rotation={shape.rotation || 0}
        opacity={shape.opacity || 1}
        // Cursor feedback for locked content
        onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = isLockedByOther ? 'not-allowed' : 'pointer'
            }
          } catch {
            // Ignore errors
          }
        }}
        onMouseLeave={(e: Konva.KonvaEventObject<MouseEvent>) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = 'default'
            }
          } catch {
            // Ignore errors
          }
        }}
      />

      {isSelected && !isLockedByOther && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // For text, we allow more flexible resizing
            // Minimum size is based on font size, not fixed dimensions
            const minSize = Math.max(20, shape.fontSize * 0.5)
            if (newBox.width < minSize || newBox.height < minSize) {
              return oldBox
            }
            return newBox
          }}
          keepRatio={true} // Keep aspect ratio for text to maintain readability
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']} // Only corner anchors for text
          anchorSize={8}
          anchorStroke="#0066ff"
          anchorFill="#ffffff"
          anchorStrokeWidth={2}
          borderStroke="#0066ff"
          borderStrokeWidth={2}
          borderDash={[5, 5]}
          rotateEnabled={true}
          centeredScaling={false} // Scale from corner, not center
        />
      )}
    </>
  )
})

TextShapeComponent.displayName = 'TextShapeComponent'

export default TextShapeComponent
