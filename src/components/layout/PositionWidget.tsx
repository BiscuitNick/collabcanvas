import React, { useState, useCallback } from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'
import { useCanvasStore } from '../../store/canvasStore'
import { SquareSquare } from 'lucide-react'

interface PositionWidgetProps {
  className?: string
}

const PositionWidget: React.FC<PositionWidgetProps> = ({ className }) => {
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
  }, [stagePosition, stageScale])

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

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2",
      className
    )}>
      <div className="flex items-center space-x-2">
        {/* X Input Group */}
        <div className="flex items-center space-x-2 px-2 h-8 border border-gray-300 rounded-md bg-white">
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
        <div className="flex items-center space-x-2 px-2 h-8 border border-gray-300 rounded-md bg-white">
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

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetPosition}
          className="h-8 w-8 p-0 hover:bg-gray-100"
          title="Reset to Origin"
        >
          <SquareSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default PositionWidget
