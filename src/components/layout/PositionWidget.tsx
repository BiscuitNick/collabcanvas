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
  const { stagePosition, stageScale, updatePosition, updateScale } = useCanvasStore()
  
  // Calculate viewport center coordinates relative to canvas center
  const getViewportCenter = useCallback(() => {
    // Get viewport dimensions
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Calculate viewport center in canvas coordinates
    const viewportCenterX = (-stagePosition.x + viewportWidth / 2) / stageScale
    const viewportCenterY = -(-stagePosition.y + viewportHeight / 2) / stageScale
    
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
    
    // Immediately update canvas position
    const viewportWidth = window.innerWidth
    const newStageX = -(value * stageScale - viewportWidth / 2)
    updatePosition(newStageX, stagePosition.y)
  }

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setYValue(value)
    
    // Immediately update canvas position
    const viewportHeight = window.innerHeight
    const newStageY = -(-value * stageScale - viewportHeight / 2)
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
    updatePosition(centerX, centerY)
    updateScale(1) // Reset zoom to 100%
    setXValue(0)
    setYValue(0)
  }


  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value)
    const clampedPercentage = isNaN(percentage) ? 100 : Math.max(5, Math.min(300, percentage))
    const scale = clampedPercentage / 100
    updateScale(scale)
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
