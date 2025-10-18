import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '../ui/button'
import DebugWidget from './DebugWidget'
import type { Content, Cursor as CursorType } from '../../types'

interface DraggableDebugWidgetProps {
  content: Content[]
  cursors: CursorType[]
  selectedShapeId: string | null
  debugMode: boolean
  showSelfCursor: boolean
  onToggleSelfCursor: (show: boolean) => void
  showFPS: boolean
  onToggleFPS: (show: boolean) => void
  enableViewportCulling: boolean
  onToggleViewportCulling: (enable: boolean) => void
  fps: number
  onClose: () => void
  enableFirestore?: boolean
  onToggleFirestore?: (enable: boolean) => void
  canvasWidth: number
  canvasHeight: number
  onCanvasWidthChange?: (width: number) => void
  onCanvasHeightChange?: (height: number) => void
}

const DraggableDebugWidget: React.FC<DraggableDebugWidgetProps> = ({
  content,
  cursors,
  selectedShapeId,
  debugMode,
  showSelfCursor,
  onToggleSelfCursor,
  showFPS,
  onToggleFPS,
  enableViewportCulling,
  onToggleViewportCulling,
  fps,
  onClose,
  enableFirestore,
  onToggleFirestore,
  canvasWidth,
  canvasHeight,
  onCanvasWidthChange,
  onCanvasHeightChange
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).closest('[data-drag-handle]')) {
      setIsDragging(true)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        })
      }
    }
  }, [])

  // Add mouse down handler to the container
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('mousedown', handleMouseDown)
      return () => {
        container.removeEventListener('mousedown', handleMouseDown)
      }
    }
  }, [handleMouseDown])

  // Handle mouse move for dragging
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x
      const newY = e.clientY - dragOffset.y
      setPosition({ x: newX, y: newY })
    }
  }, [isDragging, dragOffset])

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Add event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  if (!debugMode) return null

  return (
    <div
      ref={containerRef}
      className="fixed z-50 w-80"
      style={{
        left: position.x || 'auto',
        top: position.y || 'auto',
        right: position.x ? 'auto' : '16px',
        bottom: position.y ? 'auto' : '16px',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col max-h-[calc(100vh-8rem)]">
        {/* Header with drag handle and close button */}
        <div
          data-drag-handle
          className="flex items-center justify-between p-3 border-b border-gray-200 cursor-grab flex-shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-sm font-medium text-gray-700">Debug Info</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0 hover:bg-gray-100"
            title="Close Debug Widget"
          >
            ✕
          </Button>
        </div>

        {/* Debug Widget Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0 p-3">
          <DebugWidget
            content={content}
            cursors={cursors}
            selectedShapeId={selectedShapeId}
            debugMode={debugMode}
            showSelfCursor={showSelfCursor}
            onToggleSelfCursor={onToggleSelfCursor}
            showFPS={showFPS}
            onToggleFPS={onToggleFPS}
            enableViewportCulling={enableViewportCulling}
            onToggleViewportCulling={onToggleViewportCulling}
            fps={fps}
            enableFirestore={enableFirestore}
            onToggleFirestore={onToggleFirestore}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
            onCanvasWidthChange={onCanvasWidthChange}
            onCanvasHeightChange={onCanvasHeightChange}
          />
        </div>
      </div>
    </div>
  )
}

export default DraggableDebugWidget
