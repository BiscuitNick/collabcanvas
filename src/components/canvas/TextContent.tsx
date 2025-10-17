import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Text, Transformer } from 'react-konva'
import Konva from 'konva'
import type { TextContent } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF } from '../../lib/constants'

interface TextContentProps {
  content: TextContent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<TextContent>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
}

const TextContentComponent: React.FC<TextContentProps> = memo(({
  content,
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

  // Check if content is locked by another user
  const isLockedByOther = content.lockedByUserId && content.lockedByUserId !== currentUserId

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

    // Debounce: only update after 50ms delay
    throttleTimeoutRef.current = setTimeout(() => {
      const pendingUpdate = pendingUpdateRef.current
      if (!pendingUpdate) return

      // Throttle: only update if enough time has passed since last update (100ms)
      if (now - lastUpdateRef.current >= 100) {
        // Clamp position within canvas bounds
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF, CANVAS_HALF)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF, CANVAS_HALF)

        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
      }
    }, 50)
  }, [onDragMove])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && textRef.current) {
      try {
        transformerRef.current.nodes([textRef.current])
        transformerRef.current.getLayer()?.batchDraw()
      } catch (error) {
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
      console.log('👁️ Viewing locked text details:', content.lockedByUserName)
    }
    // Always call onSelect to show details in panel
    onSelect()
  }

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true
    // TODO: Task 4 - Enter edit mode
    console.log('TODO: Enter edit mode for text:', content.id)
  }

  const handleDragStart = () => {
    if (!isSelected) {
      console.log('❌ Cannot drag - text must be selected first')
      return
    }
    onDragStart()
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const textX = e.target.x()
    const textY = e.target.y()

    // Use throttled drag move to update position in real-time
    throttledDragMove(textX, textY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const textX = e.target.x()
    const textY = e.target.y()

    // Clamp position within canvas bounds
    const clampedX = clamp(textX, -CANVAS_HALF, CANVAS_HALF)
    const clampedY = clamp(textY, -CANVAS_HALF, CANVAS_HALF)

    // Update position in store
    onDragEnd(clampedX, clampedY)

    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformStart = () => {
    // Transform started
  }

  const handleTransformEnd = () => {
    if (!textRef.current) return

    const node = textRef.current
    const rotation = node.rotation ? node.rotation() : 0

    // Get text dimensions
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // For text, we'll update the fontSize based on scale rather than width/height
    const newFontSize = Math.round(content.fontSize * Math.max(scaleX, scaleY))

    // Calculate new position
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF)
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF)

    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((rotation % 360) + 360) % 360

    // Update content in store
    onUpdate({
      x: clampedX,
      y: clampedY,
      fontSize: newFontSize,
      rotation: normalizedRotation
    })

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)
    node.x(clampedX)
    node.y(clampedY)
  }

  return (
    <>
      <Text
        ref={textRef}
        x={content.x}
        y={content.y}
        text={content.text || ''}
        fontSize={content.fontSize}
        fontFamily={content.fontFamily}
        fontStyle={content.fontStyle}
        fill={content.fill}
        rotation={content.rotation || 0}
        align={content.textAlign || 'left'}
        verticalAlign={content.verticalAlign || 'top'}
        stroke={isLockedByOther ? (content.lockedByUserColor || '#FF0000') : (isSelected ? '#007AFF' : undefined)}
        strokeWidth={isLockedByOther ? 2 : (isSelected ? 1 : 0)}
        draggable={isSelected && !isLockedByOther}
        onClick={handleClick}
        onTap={handleClick}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
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
          keepRatio={false}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
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

TextContentComponent.displayName = 'TextContentComponent'

export default TextContentComponent
