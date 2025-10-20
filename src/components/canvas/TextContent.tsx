import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Text, Transformer, Group, Rect } from 'react-konva'
import Konva from 'konva'
import type { TextContent } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF } from '../../lib/constants'

interface LockInfo {
  userId: string
  userName: string
  lockedItemId: string | null
}

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
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
  canEdit?: boolean
  isLockedByOther?: boolean
  lockInfo?: LockInfo | null
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
  currentUserId: _currentUserId,
  selectedTool: _selectedTool,
  canEdit = true,
  isLockedByOther = false,
  lockInfo: _lockInfo = null,
}) => {
  const textRef = useRef<Konva.Text>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

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
    // Prevent selection if locked by another user
    if (isLockedByOther) {
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

  const handleDblClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent event from bubbling to stage
    e.cancelBubble = true
    e.evt.stopPropagation()

    // Prevent editing if locked by another user
    if (isLockedByOther) {
      // Already stopped propagation above, so just return
      return
    }

    // TODO: Task 4 - Enter edit mode
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

    // Reset cursor after dragging ends
    const container = e.target.getStage()?.container()
    if (container) {
      container.style.cursor = 'grab'
    }

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

  // Calculate text dimensions for centering
  const textWidth = textRef.current?.getTextWidth() || 0
  const textHeight = textRef.current?.getTextHeight() || 0

  return (
    <>
      <Text
        ref={textRef}
        x={content.x}
        y={content.y}
        offsetX={textWidth / 2}
        offsetY={textHeight / 2}
        text={content.text || ''}
        fontSize={content.fontSize}
        fontFamily={content.fontFamily}
        fontStyle={content.fontStyle}
        fill={content.fill}
        stroke={undefined}
        strokeWidth={0}
        rotation={content.rotation || 0}
        align={content.textAlign || 'left'}
        verticalAlign={content.verticalAlign || 'top'}
        draggable={isSelected && !isLockedByOther && canEdit}
        onClick={handleClick}
        onTap={handleClick}
        onMouseDown={handleMouseDown}
        onDblClick={handleDblClick}
        onDblTap={handleDblClick}
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

      {/* Lock indicator - Centered tag with username and lock icon */}
      {isLockedByOther && _lockInfo?.userName && (
        <Group>
          {/* Background rounded rectangle */}
          <Rect
            x={content.x - 60}
            y={content.y - 12}
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
          <Text
            x={content.x - 55}
            y={content.y - 8}
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
