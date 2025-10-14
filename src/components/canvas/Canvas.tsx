import React, { useRef, useEffect, useState } from 'react'
import { Stage, Layer } from 'react-konva'
import { useCanvasStore } from '../../store/canvasStore'
import CanvasErrorBoundary from './CanvasErrorBoundary'
import RectangleComponent from './Rectangle'
import type { Rectangle } from '../../types'

interface CanvasProps {
  width: number
  height: number
  shapes: Rectangle[]
  updateShape: (id: string, updates: Partial<Rectangle>) => Promise<void>
  onMouseMove?: (x: number, y: number) => void
}

const Canvas: React.FC<CanvasProps> = ({ 
  width, 
  height, 
  shapes,
  updateShape,
  onMouseMove 
}) => {
  const stageRef = useRef<any>(null)
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

  // Canvas bounds - 5000x5000 with center at (0,0)
  const CANVAS_SIZE = 5000
  const CANVAS_HALF = CANVAS_SIZE / 2

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

  const handleDragEnd = (e: any) => {
    try {
      // Don't handle stage drag if we're dragging a shape
      if (isDraggingShape) return
      
      setPanning(false)
      const clampedPos = clampPosition(e.target.x(), e.target.y())
      updatePosition(clampedPos.x, clampedPos.y)
      
      // Update cursor position on drag end
      if (onMouseMove) {
        const stage = e.target.getStage()
        const pointer = stage.getPointerPosition()
        if (pointer) {
          console.log('🖱️ Stage drag end - updating cursor:', { x: pointer.x, y: pointer.y })
          // Use the pointer position directly - it's already in screen coordinates
          onMouseMove(pointer.x, pointer.y)
        }
      }
    } catch (error) {
      console.error('Error in handleDragEnd:', error)
    }
  }

  // Handle zoom functionality
  const handleWheel = (e: any) => {
    try {
      e.evt.preventDefault()
      
      if (isPanning || isDraggingShape) return // Disable zoom while panning or dragging shapes
      
      setZooming(true)
      
      const scaleBy = 1.1
      const stage = e.target.getStage()
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      
      if (!pointer) {
        setZooming(false)
        return
      }
      
      const mousePointTo = {
        x: (pointer.x - stage.x()) / oldScale,
        y: (pointer.y - stage.y()) / oldScale,
      }
      
      const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy
      const clampedScale = Math.max(0.1, Math.min(3, newScale))
      
      setZooming(false)
      updateScale(clampedScale)
      
      const newPos = {
        x: pointer.x - mousePointTo.x * clampedScale,
        y: pointer.y - mousePointTo.y * clampedScale,
      }
      
      const clampedPos = clampPosition(newPos.x, newPos.y)
      updatePosition(clampedPos.x, clampedPos.y)
    } catch (error) {
      console.error('Error in handleWheel:', error)
      setZooming(false)
    }
  }


  // Handle stage click to deselect and update cursor
  const handleStageClick = (e: any) => {
    if (e.target === e.target.getStage()) {
      selectShape(null)
    }
    // Also update cursor position on stage click
    if (onMouseMove) {
      const stage = e.target.getStage()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        console.log('🖱️ Stage click - updating cursor:', { x: pointer.x, y: pointer.y })
        // Use the pointer position directly - it's already in screen coordinates
        onMouseMove(pointer.x, pointer.y)
      }
    }
  }

  // Handle rectangle selection
  const handleRectangleSelect = (shapeId: string) => {
    selectShape(shapeId)
  }

  // Handle rectangle updates
  const handleRectangleUpdate = (shapeId: string, updates: any) => {
    updateShape(shapeId, updates)
  }

  // Handle rectangle drag end
  const handleRectangleDragEnd = (shapeId: string, x: number, y: number) => {
    updateShape(shapeId, { x, y })
  }

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

  const handleTouchStart = (e: any) => {
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

  const handleTouchMove = (e: any) => {
    e.evt.preventDefault()
    const touches = e.evt.touches
    
    if (touches.length === 1 && isPanning) {
      // Single touch panning
      const touch = touches[0]
      const stage = e.target.getStage()
      const rect = stage.container().getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      const clampedPos = clampPosition(x, y)
      updatePosition(clampedPos.x, clampedPos.y)
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
      
      if (distance) setLastTouchDistance(distance)
      if (center) setLastTouchCenter(center)
    }
  }

  const handleTouchEnd = (e: any) => {
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Shapes Layer */}
          <Layer>
            {shapes.map((shape) => (
              <RectangleComponent
                key={shape.id}
                shape={shape}
                isSelected={selectedShapeId === shape.id}
                onSelect={() => handleRectangleSelect(shape.id)}
                onUpdate={(updates) => handleRectangleUpdate(shape.id, updates)}
                onDragEnd={(x, y) => handleRectangleDragEnd(shape.id, x, y)}
                onDragStart={() => setDraggingShape(true)}
                onDragEndCallback={() => setDraggingShape(false)}
                onMouseMove={onMouseMove}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </CanvasErrorBoundary>
  )
}

export default Canvas
