import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Group, Rect, Circle as KonvaCircle, Text as KonvaText, Transformer } from 'react-konva'
import Konva from 'konva'
import type { GroupContent } from '../../types'
import { isRectangleContent, isCircleContent, isTextContent, isImageContent } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../lib/constants'
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS } from '../../lib/config'

interface LockInfo {
  userId: string
  userName: string
  lockedItemId: string | null
}

interface GroupContentProps {
  content: GroupContent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<GroupContent>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
  canEdit?: boolean
  enableGroupCaching?: boolean
  isLockedByOther?: boolean
  lockInfo?: LockInfo | null
}

const GroupContentComponent: React.FC<GroupContentProps> = memo(({
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
  enableGroupCaching = false,
  isLockedByOther = false,
  lockInfo: _lockInfo = null,
}) => {
  const groupRef = useRef<Konva.Group>(null)
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

    // Debounce: only update after configured delay
    throttleTimeoutRef.current = setTimeout(() => {
      const pendingUpdate = pendingUpdateRef.current
      if (!pendingUpdate) return

      // Throttle: only update if enough time has passed since last update
      if (now - lastUpdateRef.current >= RECTANGLE_DRAG_THROTTLE_MS) {
        // Clamp position within canvas bounds
        const halfWidth = content.width / 2
        const halfHeight = content.height / 2
        const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
        const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

        onDragMove(clampedX, clampedY)
        lastUpdateRef.current = now
        pendingUpdateRef.current = null
      }
    }, RECTANGLE_DRAG_DEBOUNCE_MS)
  }, [onDragMove, content.width, content.height])

  // Update transformer when selection changes
  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      try {
        transformerRef.current.nodes([groupRef.current])
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

  // Handle group caching for performance
  useEffect(() => {
    if (!groupRef.current) return

    if (enableGroupCaching) {
      // Cache the group for better performance
      groupRef.current.cache()
    } else {
      // Clear cache when disabled
      groupRef.current.clearCache()
    }

    // Cleanup on unmount
    return () => {
      if (groupRef.current) {
        groupRef.current.clearCache()
      }
    }
  }, [enableGroupCaching, content.contentIds, content.contentData, content.width, content.height, content.scaleX, content.scaleY, content.rotation, content.id])

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent selection if locked by another user
    if (isLockedByOther) {
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

    // Only allow drag if content is selected
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
    // Get the current position of the group
    const groupX = e.target.x()
    const groupY = e.target.y()

    // Use throttled drag move to update position in real-time
    throttledDragMove(groupX, groupY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    // Get the current position of the group
    const groupX = e.target.x()
    const groupY = e.target.y()

    // Clamp position within canvas bounds
    const halfWidth = content.width / 2
    const halfHeight = content.height / 2
    const clampedX = clamp(groupX, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
    const clampedY = clamp(groupY, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

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

  const handleTransformEnd = () => {
    if (!groupRef.current) return

    const node = groupRef.current
    const rotation = node.rotation ? node.rotation() : 0

    // For groups, we use scaleX and scaleY instead of changing width/height
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Calculate new position
    const newX = node.x()
    const newY = node.y()

    // Clamp position within canvas bounds
    const halfWidth = content.width / 2
    const halfHeight = content.height / 2
    const clampedX = clamp(newX, -CANVAS_HALF + halfWidth, CANVAS_HALF - halfWidth)
    const clampedY = clamp(newY, -CANVAS_HALF + halfHeight, CANVAS_HALF - halfHeight)

    // Normalize rotation to 0-360 degrees
    const normalizedRotation = ((rotation % 360) + 360) % 360

    // Update content in store
    onUpdate({
      x: clampedX,
      y: clampedY,
      scaleX: scaleX,
      scaleY: scaleY,
      rotation: normalizedRotation
    })

    // Update position
    node.x(clampedX)
    node.y(clampedY)
  }

  // Render a nested content item without event listeners
  const renderNestedItem = (itemId: string) => {
    const item = content.contentData[itemId]
    if (!item) {
      return null
    }

    if (isRectangleContent(item)) {
      return (
        <Rect
          key={itemId}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          rotation={item.rotation || 0}
          fill={item.fill}
          stroke={item.stroke}
          strokeWidth={item.strokeWidth}
          cornerRadius={item.cornerRadius}
          listening={false} // No event listeners for nested items
        />
      )
    }

    if (isCircleContent(item)) {
      return (
        <KonvaCircle
          key={itemId}
          x={item.x}
          y={item.y}
          radius={item.radius}
          rotation={item.rotation || 0}
          fill={item.fill}
          stroke={item.stroke}
          strokeWidth={item.strokeWidth}
          listening={false} // No event listeners for nested items
        />
      )
    }

    if (isTextContent(item)) {
      return (
        <KonvaText
          key={itemId}
          x={item.x}
          y={item.y}
          text={item.text}
          fontSize={item.fontSize}
          fontFamily={item.fontFamily}
          fontStyle={item.fontStyle}
          fill={item.fill}
          width={item.width}
          height={item.height}
          align={item.textAlign}
          verticalAlign={item.verticalAlign}
          rotation={item.rotation || 0}
          listening={false} // No event listeners for nested items
        />
      )
    }

    if (isImageContent(item)) {
      // Note: Image rendering would need to load the image first
      // For now, just render a placeholder rectangle
      return (
        <Rect
          key={itemId}
          x={item.x}
          y={item.y}
          width={item.width}
          height={item.height}
          offsetX={item.width / 2}
          offsetY={item.height / 2}
          rotation={item.rotation || 0}
          fill="#cccccc"
          listening={false} // No event listeners for nested items
        />
      )
    }

    return null
  }

  return (
    <>
      <Group
        ref={groupRef}
        x={content.x}
        y={content.y}
        offsetX={content.width / 2}
        offsetY={content.height / 2}
        width={content.width}
        height={content.height}
        scaleX={content.scaleX || 1}
        scaleY={content.scaleY || 1}
        rotation={content.rotation || 0}
        clipFunc={(ctx) => {
          // Clip to the group's width and height
          ctx.rect(0, 0, content.width, content.height)
        }}
        draggable={isSelected && !isLockedByOther && canEdit}
        onClick={handleClick}
        onTap={handleClick}
        onMouseDown={handleMouseDown}
        onDragStart={isSelected && !isLockedByOther && canEdit ? handleDragStart : undefined}
        onDragMove={isSelected && !isLockedByOther && canEdit ? handleDragMove : undefined}
        onDragEnd={isSelected && !isLockedByOther && canEdit ? handleDragEnd : undefined}
        onTransformEnd={isSelected && !isLockedByOther && canEdit ? handleTransformEnd : undefined}
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
      >
        {/* Render clipping boundary as a transparent rect (for visual feedback when selected) */}
        <Rect
          x={0}
          y={0}
          width={content.width}
          height={content.height}
          fill="transparent"
          stroke={isSelected ? '#007AFF' : 'transparent'}
          strokeWidth={isSelected ? 2 : 0}
          listening={true}
        />

        {/* Render nested items in order (last item is on top) */}
        {content.contentIds.map(renderNestedItem)}
      </Group>

      {/* Lock indicator - Centered tag with username and lock icon */}
      {isLockedByOther && _lockInfo?.userName && (
        <Group
          x={content.x}
          y={content.y}
          offsetX={content.width / 2}
          offsetY={content.height / 2}
        >
          {/* Background rounded rectangle */}
          <Rect
            x={content.width / 2 - 60}
            y={content.height / 2 - 12}
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
            x={content.width / 2 - 55}
            y={content.height / 2 - 8}
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

GroupContentComponent.displayName = 'GroupContentComponent'

export default GroupContentComponent
