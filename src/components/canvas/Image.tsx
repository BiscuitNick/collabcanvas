import React, { useRef, useEffect, useCallback, memo } from 'react'
import { Image as KonvaImage, Transformer } from 'react-konva'
import Konva from 'konva'
import type { ImageContent } from '../../types'
import { clamp } from '../../lib/utils'
import { CANVAS_HALF } from '../../lib/constants'
import { LOCK_INDICATOR_STROKE_WIDTH } from '../../lib/config'

interface ImageComponentProps {
  content: ImageContent
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ImageContent>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | null
}

const ImageComponent: React.FC<ImageComponentProps> = memo(({
  content,
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
  const imageRef = useRef<Konva.Image>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)
  const imageObjRef = useRef<HTMLImageElement | null>(null)

  // Check if content is locked by another user
  const isLockedByOther = content.lockedByUserId && content.lockedByUserId !== currentUserId

  // Load image from URL
  useEffect(() => {
    if (!content.src) return

    const img = new window.Image()

    // Try loading with CORS first
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      imageObjRef.current = img
      if (imageRef.current) {
        imageRef.current.image(img)
        imageRef.current.getLayer()?.batchDraw()
      }
    }

    img.onerror = () => {
      console.warn('Failed to load image with CORS, retrying without CORS:', content.src)

      // Retry without CORS
      const imgNoCors = new window.Image()
      imgNoCors.onload = () => {
        imageObjRef.current = imgNoCors
        if (imageRef.current) {
          imageRef.current.image(imgNoCors)
          imageRef.current.getLayer()?.batchDraw()
        }
      }
      imgNoCors.onerror = () => {
        console.error('Failed to load image completely:', content.src)
      }
      imgNoCors.src = content.src
    }

    img.src = content.src
  }, [content.src])

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
    if (isSelected && transformerRef.current && imageRef.current) {
      try {
        transformerRef.current.nodes([imageRef.current])
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
    console.log('🖱️ Canvas clicked - Image:', { id: content.id, x: content.x.toFixed(2), y: content.y.toFixed(2), src: content.src })

    // Only allow selection with select, pan, or ai tools
    const allowSelection = selectedTool === 'select' || selectedTool === 'pan' || selectedTool === 'ai' || selectedTool === null

    if (!allowSelection) {
      console.log('🔧 Tool active - passing click through to canvas')
      return
    }

    // Prevent selection if locked by another user
    if (isLockedByOther) {
      console.log('⚠️ Cannot select - locked by another user')
      e.cancelBubble = true
      e.evt.stopPropagation()
      return
    }

    // Prevent event from bubbling to stage for selection
    e.cancelBubble = true
    e.evt.stopPropagation()

    // Call onSelect to show details in panel
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

    if (!isSelected) {
      // Prevent the drag
      e.target.stopDrag()
      return
    }
    onDragStart()
  }

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const imageX = e.target.x()
    const imageY = e.target.y()

    // Use throttled drag move to update position in real-time
    throttledDragMove(imageX, imageY)
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const imageX = e.target.x()
    const imageY = e.target.y()

    // Clamp position within canvas bounds
    const clampedX = clamp(imageX, -CANVAS_HALF, CANVAS_HALF)
    const clampedY = clamp(imageY, -CANVAS_HALF, CANVAS_HALF)

    // Update position in store
    onDragEnd(clampedX, clampedY)

    // Notify parent that dragging has ended
    onDragEndCallback()
  }

  const handleTransformEnd = () => {
    if (!imageRef.current) return

    const node = imageRef.current
    const rotation = node.rotation ? node.rotation() : 0

    // Get image dimensions after transform
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    const newWidth = Math.round(content.width * scaleX)
    const newHeight = Math.round(content.height * scaleY)

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
      width: newWidth,
      height: newHeight,
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
      <KonvaImage
        ref={imageRef}
        image={imageObjRef.current || undefined}
        x={content.x}
        y={content.y}
        width={content.width}
        height={content.height}
        stroke={isLockedByOther ? (content.lockedByUserColor || '#FF0000') : undefined}
        strokeWidth={isLockedByOther ? LOCK_INDICATOR_STROKE_WIDTH : 0}
        rotation={content.rotation || 0}
        draggable={isSelected && !isLockedByOther}
        onClick={handleClick}
        onTap={handleClick}
        onMouseDown={handleMouseDown}
        onDragStart={isSelected && !isLockedByOther ? handleDragStart : undefined}
        onDragMove={isSelected && !isLockedByOther ? handleDragMove : undefined}
        onDragEnd={isSelected && !isLockedByOther ? handleDragEnd : undefined}
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
          keepRatio={true}
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

ImageComponent.displayName = 'ImageComponent'

export default ImageComponent
