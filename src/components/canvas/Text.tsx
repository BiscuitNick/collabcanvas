import React, { useRef, useEffect, useCallback, memo, useState } from 'react'
import { Text as KonvaText, Transformer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import type { Text } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS, ENABLE_PERFORMANCE_LOGGING } from '../../lib/config'

interface TextProps {
  shape: Text
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Text>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
}

const TextComponent: React.FC<TextProps> = memo(({
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
  const textRef = useRef<Konva.Text>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  // Check if shape is locked by another user
  const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId
  
  // Debug: Log lock color info
  if (isLockedByOther) {
    console.log('🎨 Locked text color:', {
      shapeId: shape.id,
      lockedByUserId: shape.lockedByUserId,
      lockedByUserName: shape.lockedByUserName,
      lockedByUserColor: shape.lockedByUserColor,
      currentUserId
    })
  }

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
        
        // Clamp position within canvas bounds (using width/height for bounds checking)
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF, CANVAS_HALF - shape.width)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF, CANVAS_HALF - shape.height)
        
        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
        
        if (ENABLE_PERFORMANCE_LOGGING) {
          const duration = performance.now() - startTime
          console.log(`📝 Text drag update took ${duration.toFixed(2)}ms`)
        }
      }
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onDragMove, shape.width, shape.height])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      try {
        transformerRef.current.nodes([textRef.current])
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
    
    // Double-click to start editing
    if (e.evt?.detail === 2) {
      if (!isLockedByOther) {
        setIsEditing(true)
      }
    } else {
      // Single click to select
      if (isLockedByOther) {
        console.log('👁️ Viewing locked text details:', shape.lockedByUserName)
      }
      onSelect()
    }
  }

  const handleDragStart = () => {
    // Only allow drag if shape is selected and not editing
    if (!isSelected || isEditing) {
      console.log('❌ Cannot drag - text must be selected and not editing')
      return
    }
    // Notify parent that dragging has started
    onDragStart()
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the text
    const textX = e.target.x()
    const textY = e.target.y()
    
    // Use throttled drag move to update position in real-time
    throttledDragMove(textX, textY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the text
    const textX = e.target.x()
    const textY = e.target.y()
    
    // Clamp position within canvas bounds
    const clampedX = clamp(textX, -CANVAS_HALF, CANVAS_HALF - shape.width)
    const clampedY = clamp(textY, -CANVAS_HALF, CANVAS_HALF - shape.height)
    
    // Update position in store (React will handle the re-render)
    onDragEnd(clampedX, clampedY)
    
    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = () => {
    // Transform started - no locking needed
  }

  const handleTransformEnd = () => {
    if (!textRef.current) return

    const node = textRef.current
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Calculate new dimensions using the average of scaleX and scaleY
    const currentWidth = node.width() * scaleX
    const currentHeight = node.height() * scaleY
    const newWidth = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentWidth))
    const newHeight = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, currentHeight))

    // Calculate new position - use the current node position as Konva handles the transform
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
    node.width(newWidth)
    node.height(newHeight)
    node.x(clampedX)
    node.y(clampedY)
  }

  const handleTextChange = (newText: string) => {
    onUpdate({ text: newText })
  }

  const handleEditEnd = () => {
    setIsEditing(false)
  }

  // Calculate font style string (currently unused but kept for future use)
  // const getFontStyle = () => {
  //   const weight = shape.fontStyle === 'bold' || shape.fontStyle === 'bold italic' ? 'bold' : 'normal'
  //   const style = shape.fontStyle === 'italic' || shape.fontStyle === 'bold italic' ? 'italic' : 'normal'
  //   return `${style} ${weight} ${shape.fontSize}px ${shape.fontFamily}`
  // }

  // Calculate text alignment
  const getTextAlign = () => {
    return shape.textAlign
  }

  // Calculate vertical alignment
  const getVerticalAlign = () => {
    return shape.verticalAlign
  }

  return (
    <>
      <KonvaText
        ref={textRef}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        text={shape.text}
        fontSize={shape.fontSize}
        fontFamily={shape.fontFamily}
        fontStyle={shape.fontStyle}
        fill={shape.fill}
        align={getTextAlign()}
        verticalAlign={getVerticalAlign()}
        wrap="word"
        shadowColor="rgba(0, 0, 0, 0.1)"
        shadowBlur={4}
        shadowOffset={{ x: 2, y: 2 }}
        shadowOpacity={0.3}
        draggable={isSelected && !isLockedByOther && !isEditing}
        onClick={handleClick}
        onTap={handleClick}
        onDragStart={isSelected && !isLockedByOther && !isEditing ? handleDragStart : undefined}
        onDragMove={isSelected && !isLockedByOther && !isEditing ? handleDragMove : undefined}
        onDragEnd={isSelected && !isLockedByOther && !isEditing ? handleDragEnd : undefined}
        onTransformStart={isSelected && !isLockedByOther && !isEditing ? handleTransformStart : undefined}
        onTransformEnd={isSelected && !isLockedByOther && !isEditing ? handleTransformEnd : undefined}
        // Hover effects
        onMouseEnter={(e: Konva.KonvaEventObject<MouseEvent>) => {
          try {
            const container = e.target.getStage()?.container()
            if (container) {
              container.style.cursor = isLockedByOther ? 'not-allowed' : (isEditing ? 'text' : 'pointer')
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
      {isSelected && !isLockedByOther && !isEditing && (
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
          borderStroke={isLockedByOther ? (shape.lockedByUserColor || '#FF0000') : '#007AFF'}
          borderStrokeWidth={isLockedByOther ? Math.min(20, ((shape.width + shape.height) / 2) * 0.1) : 2}
          borderDash={[5, 5]}
          rotateEnabled={false} // No rotation for text as per requirements
        />
      )}
      {/* Inline editing overlay - this would be implemented with a separate component in a real app */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            left: shape.x,
            top: shape.y,
            width: shape.width,
            height: shape.height,
            zIndex: 1000,
            pointerEvents: 'all'
          }}
        >
          <textarea
            value={shape.text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={handleEditEnd}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEditEnd()
              }
              if (e.key === 'Escape') {
                handleEditEnd()
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: `${shape.fontSize}px`,
              fontFamily: shape.fontFamily,
              fontStyle: shape.fontStyle,
              color: shape.fill,
              textAlign: shape.textAlign as any,
              resize: 'none',
              padding: '4px'
            }}
            autoFocus
          />
        </div>
      )}
    </>
  )
})

TextComponent.displayName = 'TextComponent'

export default TextComponent
