import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Stage, Layer } from 'react-konva'
import Konva from 'konva' // Import Konva for types
import { useCanvasStore } from '../../store/canvasStore'
import CanvasErrorBoundary from './CanvasErrorBoundary'
import RectangleComponent from './Rectangle'
import Cursor from '../multiplayer/Cursor'
import type { Rectangle, Cursor as CursorType } from '../../types'
import { CANVAS_HALF } from '../../lib/constants'

interface CanvasProps {
  width: number
  height: number
  shapes: Rectangle[]
  cursors: CursorType[]
  updateShape: (id: string, updates: Partial<Rectangle>) => Promise<void>
  onMouseMove: (x: number, y: number, canvasWidth: number, canvasHeight: number) => void
  showSelfCursor?: boolean
  currentUserId?: string
  enableViewportCulling?: boolean
  onVisibleShapesChange?: (visibleCount: number) => void
  lockShape?: (id: string) => Promise<void>
  unlockShape?: (id: string) => Promise<void>
}

const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  shapes,
  cursors,
  updateShape,
  onMouseMove,
  showSelfCursor = true,
  currentUserId,
  enableViewportCulling = false,
  onVisibleShapesChange,
  lockShape,
  unlockShape
}) => {
  const stageRef = useRef<Konva.Stage>(null)
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null)
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null)

  const {
    stagePosition,
    stageScale,
    isPanning,
    isZooming,
    isDraggingShape,
    selectedShapeId,
    updatePosition,
    updateScale,
    setPanning,
    setZooming,
    setDraggingShape,
    selectShape
  } = useCanvasStore()

  // Canvas bounds - 64000x64000 with center at (0,0) for infinite feel
  // Moved to src/lib/constants.ts

  // Clamp position within canvas bounds
  const clampPosition = (x: number, y: number) => {
    const minX = -CANVAS_HALF
    const maxX = CANVAS_HALF
    const minY = -CANVAS_HALF
    const maxY = CANVAS_HALF

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    }
  }

  // Handle pan functionality
  const handleDragStart = () => {
    try {
      // Don't start panning if we're dragging a shape
      if (isDraggingShape) return

      setPanning(true)
      setZooming(false)
    } catch (error) {
      console.error('Error in handleDragStart:', error)
    }
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    try {
      // Don't handle stage drag if we're dragging a shape
      if (isDraggingShape) return

      setPanning(false)
      const clampedPos = clampPosition(e.target.x(), e.target.y())
      updatePosition(clampedPos.x, clampedPos.y)

      // Update cursor position on drag end
      if (onMouseMove) {
        const stage = e.target.getStage()
        if (stage) {
          const pointer = stage.getPointerPosition()
          if (pointer) {
            // Use the stage's live transform (avoids any store lag)
            const transform = stage.getAbsoluteTransform().copy().invert()
            const canvasPoint = transform.point({ x: pointer.x, y: pointer.y })
            const canvasX = canvasPoint.x
            const canvasY = canvasPoint.y
            onMouseMove(canvasX, canvasY, width, height)
          }
        }
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error)
    }
  }

  // Handle zoom functionality
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    try {
      e.evt.preventDefault()

      if (isPanning || isDraggingShape) return // Disable zoom while panning or dragging shapes

      setZooming(true)

      const scaleBy = 1.1
      const stage = e.target.getStage()
      const oldScale = stage?.scaleX()
      const pointer = stage?.getPointerPosition()

      if (!pointer || !stage || oldScale === undefined) {
        setZooming(false)
        return
      }

      // Get the point in canvas space before zoom
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }

      const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
      const clampedScale = Math.max(0.1, Math.min(3, newScale))

      // Calculate new stage position to keep the mouse point fixed
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      }

      setZooming(false)
      updateScale(clampedScale)
      
      const clampedPos = clampPosition(newPos.x, newPos.y)
      updatePosition(clampedPos.x, clampedPos.y)
    } catch (error) {
      console.error('Error in handleWheel:', error)
      setZooming(false)
    }
  }


  // Handle stage click to deselect
  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      // Unlock current shape before deselecting
      if (selectedShapeId && unlockShape) {
        console.log('🔓 Attempting to unlock shape:', selectedShapeId)
        unlockShape(selectedShapeId)
      }
      selectShape(null)
    }
  }

  // Handle mouse movement for cursor tracking
  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (onMouseMove) {
      const stage = e.target.getStage()
      if (stage) {
        const pointer = stage.getPointerPosition()
        if (pointer) {
          const transform = stage.getAbsoluteTransform().copy().invert()
          const canvasPoint = transform.point({ x: pointer.x, y: pointer.y })
          const canvasX = canvasPoint.x
          const canvasY = canvasPoint.y
          onMouseMove(canvasX, canvasY, width, height)
        }
      }
    }
  }

  // Handle mouse leave to hide cursor
  const handleMouseLeave = () => {
    // We could implement cursor hiding logic here if needed
    // For now, we'll let the cursor remain visible
  }

  // Handle rectangle selection
  const handleRectangleSelect = useCallback((shapeId: string) => {
    console.log('🎯 Selecting shape:', shapeId)
    
    // Find the shape to check if it's locked
    const shape = shapes.find(s => s.id === shapeId)
    const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId
    
    // Unlock previously selected shape if different
    if (selectedShapeId && selectedShapeId !== shapeId && unlockShape) {
      console.log('🔓 Unlocking previous shape:', selectedShapeId)
      unlockShape(selectedShapeId)
    }
    
    selectShape(shapeId)
    
    // Only lock if not already locked by another user
    if (lockShape && !isLockedByOther) {
      console.log('🔒 Attempting to lock shape:', shapeId)
      lockShape(shapeId)
    } else if (isLockedByOther) {
      console.log('👁️ Shape is locked by another user, viewing only')
    }
  }, [selectShape, lockShape, unlockShape, selectedShapeId, shapes, currentUserId])

  // Handle rectangle updates
  const handleRectangleUpdate = useCallback((shapeId: string, updates: Partial<Rectangle>) => {
    updateShape(shapeId, updates)
  }, [updateShape])

  // Handle rectangle drag move (real-time updates while dragging)
  const handleRectangleDragMove = useCallback((shapeId: string, x: number, y: number) => {
    updateShape(shapeId, { x, y })
  }, [updateShape])

  // Handle rectangle drag end
  const handleRectangleDragEnd = useCallback((shapeId: string, x: number, y: number) => {
    updateShape(shapeId, { x, y })
  }, [updateShape])

  // Mobile touch handlers
  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null
    const touch1 = touches[0]
    const touch2 = touches[1]
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    )
  }

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return null
    const touch1 = touches[0]
    const touch2 = touches[1]
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  }

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault()
    const touches = e.evt.touches

    if (touches.length === 1) {
      // Single touch - start panning
      setPanning(true)
      setZooming(false)
    } else if (touches.length === 2) {
      // Two touches - start pinch zoom
      setPanning(false)
      setZooming(true)
      const distance = getTouchDistance(touches)
      const center = getTouchCenter(touches)
      if (distance) setLastTouchDistance(distance)
      if (center) setLastTouchCenter(center)
    }
  }

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault()
    const touches = e.evt.touches

    if (touches.length === 1 && isPanning) {
      // Single touch panning
      const touch = touches[0]
      const stage = e.target.getStage()
      if (stage) {
        const rect = stage.container().getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top
        const clampedPos = clampPosition(x, y)
        updatePosition(clampedPos.x, clampedPos.y)
      }
    } else if (touches.length === 2 && isZooming) {
      // Two touch pinch zoom
      const distance = getTouchDistance(touches)
      const center = getTouchCenter(touches)

      if (distance && lastTouchDistance && center && lastTouchCenter) {
        const scaleBy = distance / lastTouchDistance
        const newScale = stageScale * scaleBy
        const clampedScale = Math.max(0.1, Math.min(3, newScale))

        updateScale(clampedScale)

        // Adjust position to zoom towards center
        const stage = e.target.getStage()
        if (stage) {
          const rect = stage.container().getBoundingClientRect()
          const stageX = center.x - rect.left
          const stageY = center.y - rect.top

          const mousePointTo = {
            x: (stageX - stagePosition.x) / stageScale,
            y: (stageY - stagePosition.y) / stageScale,
          }

          const newPos = {
            x: stageX - mousePointTo.x * clampedScale,
            y: stageY - mousePointTo.y * clampedScale,
          }

          const clampedPos = clampPosition(newPos.x, newPos.y)
          updatePosition(clampedPos.x, clampedPos.y)
        }
      }

      if (distance) setLastTouchDistance(distance)
      if (center) setLastTouchCenter(center)
    }
  }

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault()
    setPanning(false)
    setZooming(false)
    setLastTouchDistance(null)
    setLastTouchCenter(null)
  }


  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '=':
          case '+':
            e.preventDefault()
            updateScale(stageScale * 1.1)
            break
          case '-':
            e.preventDefault()
            updateScale(stageScale / 1.1)
            break
        }
      } else if (e.key === 'Escape') {
        selectShape(null)
        useCanvasStore.getState().resetView()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stageScale, updateScale, selectShape])

  // Viewport culling: Only render shapes visible in the viewport
  const getVisibleShapes = useCallback((shapesToFilter: Rectangle[]) => {
    if (!enableViewportCulling) return shapesToFilter

    // Calculate viewport bounds in canvas coordinates
    const viewportBounds = {
      left: -stagePosition.x / stageScale,
      top: -stagePosition.y / stageScale,
      right: (-stagePosition.x + width) / stageScale,
      bottom: (-stagePosition.y + height) / stageScale
    }

    // Add padding to prevent pop-in during pan/zoom (adjusts with scale)
    const padding = 500 / stageScale

    return shapesToFilter.filter(shape => {
      // Check if shape is within visible bounds (with padding)
      return !(
        shape.x + shape.width < viewportBounds.left - padding ||
        shape.x > viewportBounds.right + padding ||
        shape.y + shape.height < viewportBounds.top - padding ||
        shape.y > viewportBounds.bottom + padding
      )
    })
  }, [stagePosition.x, stagePosition.y, stageScale, width, height, enableViewportCulling])

  // Get visible shapes for rendering
  const visibleShapes = useMemo(() => {
    const visible = getVisibleShapes(shapes)

    // Log performance info when culling is enabled
    if (enableViewportCulling && visible.length !== shapes.length) {
      console.log(`🎯 Viewport culling: rendering ${visible.length} of ${shapes.length} shapes (${Math.round(visible.length / shapes.length * 100)}%)`)
    }

    return visible
  }, [shapes, getVisibleShapes, enableViewportCulling])

  // Notify parent of visible shapes count
  useEffect(() => {
    if (onVisibleShapesChange) {
      onVisibleShapesChange(visibleShapes.length)
    }
  }, [visibleShapes.length, onVisibleShapesChange])

  // Memoize shapes rendering to prevent unnecessary re-renders
  const renderedShapes = useMemo(() => {
    return visibleShapes.map((shape) => (
      <RectangleComponent
        key={shape.id}
        shape={shape}
        isSelected={selectedShapeId === shape.id}
        onSelect={() => handleRectangleSelect(shape.id)}
        onUpdate={(updates) => handleRectangleUpdate(shape.id, updates)}
        onDragMove={(x, y) => handleRectangleDragMove(shape.id, x, y)}
        onDragEnd={(x, y) => handleRectangleDragEnd(shape.id, x, y)}
        onDragStart={() => setDraggingShape(true)}
        onDragEndCallback={() => setDraggingShape(false)}
        currentUserId={currentUserId}
      />
    ))
  }, [visibleShapes, selectedShapeId, handleRectangleSelect, handleRectangleUpdate, handleRectangleDragMove, handleRectangleDragEnd, setDraggingShape, currentUserId])

  return (
    <CanvasErrorBoundary>
      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={!isZooming && !isDraggingShape}
          onDragStart={!isDraggingShape ? handleDragStart : undefined}
          onDragEnd={!isDraggingShape ? handleDragEnd : undefined}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Shapes Layer */}
          <Layer>
            {renderedShapes}
          </Layer>
          
          {/* Cursors Layer */}
          <Layer>
            {cursors
              .filter(cursor => {
                // Filter out invisible cursors
                if (cursor.isVisible === false) return false
                
                // Filter out self cursor if showSelfCursor is false
                if (!showSelfCursor && currentUserId && cursor.userId === currentUserId) return false
                
                return true
              })
              .map((cursor) => (
                <Cursor key={cursor.userId} cursor={cursor} />
              ))}
          </Layer>
        </Stage>
      </div>
    </CanvasErrorBoundary>
  )
}

export default Canvas
