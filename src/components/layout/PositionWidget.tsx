import React, { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'
import { useCanvasStore } from '../../store/canvasStore'
import { SquareSquare, X } from 'lucide-react'
import { getZoomStep } from '../../lib/utils'
import ToolButton from './ToolButton'

interface PositionWidgetProps {
  className?: string
}

const PositionWidget: React.FC<PositionWidgetProps> = ({ className }) => {
  const [isVisible, setIsVisible] = useState(true)
  const { stagePosition, stageScale, updatePosition, updatePositionAnimated, updateScale, selectedContentId, content } = useCanvasStore()
  
  // Calculate viewport center coordinates in canvas space (where canvas center is 0,0)
  const getViewportCenter = useCallback(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Calculate viewport center in canvas coordinates
    // Canvas coordinate = (viewport point - stage position) / scale
    const viewportCenterX = (viewportWidth / 2 - stagePosition.x) / stageScale
    const viewportCenterY = (viewportHeight / 2 - stagePosition.y) / stageScale

    return {
      x: Math.round(viewportCenterX),
      y: Math.round(viewportCenterY)
    }
  }, [stagePosition, stageScale])

  const [xValue, setXValue] = useState(() => getViewportCenter().x)
  const [yValue, setYValue] = useState(() => getViewportCenter().y)

  // Update local values when stage position or scale changes
  React.useEffect(() => {
    const center = getViewportCenter()
    setXValue(center.x)
    setYValue(center.y)
  }, [stagePosition, stageScale, getViewportCenter])

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setXValue(value)

    // Pan to show this canvas X coordinate at viewport center
    // viewport center = stage position + canvas point * scale
    // stage position = viewport center - canvas point * scale
    const viewportWidth = window.innerWidth
    const newStageX = (viewportWidth / 2) - (value * stageScale)
    updatePosition(newStageX, stagePosition.y)
  }

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setYValue(value)

    // Pan to show this canvas Y coordinate at viewport center
    // viewport center = stage position + canvas point * scale
    // stage position = viewport center - canvas point * scale
    const viewportHeight = window.innerHeight
    const newStageY = (viewportHeight / 2) - (value * stageScale)
    updatePosition(stagePosition.x, newStageY)
  }

  const handleXBlur = () => {
    // Re-sync with current position in case of invalid input
    const center = getViewportCenter()
    setXValue(center.x)
  }

  const handleYBlur = () => {
    // Re-sync with current position in case of invalid input
    const center = getViewportCenter()
    setYValue(center.y)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
  }

  const handleResetPosition = () => {
    // Center viewport on origin (0,0)
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2
    updatePositionAnimated(centerX, centerY) // Use animated pan for reset
    updateScale(1) // Reset zoom to 100%
    setXValue(0)
    setYValue(0)
  }


  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value)
    const clampedPercentage = isNaN(percentage) ? 100 : Math.max(5, Math.min(300, percentage))
    const newScale = clampedPercentage / 100
    const oldScale = stageScale

    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const viewportCenterX = viewportWidth / 2
    const viewportCenterY = viewportHeight / 2

    // Calculate the focal point for zooming (in canvas coordinates where center is 0,0)
    let canvasFocalX: number
    let canvasFocalY: number

    // If content is selected, zoom to its center
    if (selectedContentId) {
      const selectedContent = content.find(c => c.id === selectedContentId)
      if (selectedContent) {
        // All content is now center-anchored, so x,y IS the center
        canvasFocalX = selectedContent.x
        canvasFocalY = selectedContent.y
      } else {
        // Fallback to viewport center if selected content not found
        canvasFocalX = (viewportCenterX - stagePosition.x) / oldScale
        canvasFocalY = (viewportCenterY - stagePosition.y) / oldScale
      }
    } else {
      // No selection - zoom to what's currently at viewport center
      // Convert viewport center to canvas coordinates
      canvasFocalX = (viewportCenterX - stagePosition.x) / oldScale
      canvasFocalY = (viewportCenterY - stagePosition.y) / oldScale
    }

    // Calculate new stage position to keep focal point at viewport center
    // viewport center = stage position + canvas focal point * new scale
    // stage position = viewport center - canvas focal point * new scale
    const newPosX = viewportCenterX - (canvasFocalX * newScale)
    const newPosY = viewportCenterY - (canvasFocalY * newScale)

    // Update scale and position together
    updateScale(newScale)
    updatePosition(newPosX, newPosY)
  }

  const handleZoomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const currentPercentage = Math.round(stageScale * 100)
    e.target.value = currentPercentage.toString()
  }

  const currentZoomPercentage = Math.round(stageScale * 100)
  const zoomStep = getZoomStep(currentZoomPercentage)

  // When closed, show toggle button
  if (!isVisible) {
    return (
      <ToolButton
        onClick={() => setIsVisible(true)}
        icon={<SquareSquare className="h-5 w-5" />}
        title="Show Position & Zoom"
      />
    )
  }

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2",
      className
    )}>
      <div className="flex items-center space-x-2">
        {/* Close Button - Left Side */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsVisible(false)}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Hide Position & Zoom"
        >
          <X className="h-4 w-4" />
        </Button>

        {/* XY Position Section */}
        <div className="flex items-center space-x-2">
          {/* X Input Group */}
          <div className="flex items-center space-x-2 px-2 h-8 border border-gray-200 rounded-md bg-white">
            <span className="text-xs font-medium text-gray-500">X</span>
            <Input
              id="canvas-x"
              type="number"
              value={xValue}
              onChange={handleXChange}
              onBlur={handleXBlur}
              onKeyPress={handleKeyPress}
              className="h-6 w-16 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              placeholder="0"
              step="100"
            />
          </div>

          {/* Y Input Group */}
          <div className="flex items-center space-x-2 px-2 h-8 border border-gray-200 rounded-md bg-white">
            <span className="text-xs font-medium text-gray-500">Y</span>
            <Input
              id="canvas-y"
              type="number"
              value={yValue}
              onChange={handleYChange}
              onBlur={handleYBlur}
              onKeyPress={handleKeyPress}
              className="h-6 w-16 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              placeholder="0"
              step="100"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Zoom Section */}
        <div className="flex items-center space-x-1">
          {/* Zoom Level Input */}
          <div className="relative">
            <Input
              type="number"
              value={currentZoomPercentage}
              onChange={handleZoomChange}
              onBlur={handleZoomBlur}
              className="h-8 w-20 text-xs text-center pr-6 border border-gray-200"
              step={zoomStep}
              min="5"
              max="300"
            />
            <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
              %
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200"></div>

        {/* Reset Button Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetPosition}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Reset to Origin (0,0) at 100%"
        >
          <SquareSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default PositionWidget
