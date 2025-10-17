import React from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { cn } from '../../lib/utils'
import { useCanvasStore } from '../../store/canvasStore'
import { getZoomStep } from '../../lib/utils'

interface ZoomWidgetProps {
  className?: string
}

const ZoomWidget: React.FC<ZoomWidgetProps> = ({ className }) => {
  const { stageScale, updateScale } = useCanvasStore()

  const handleZoomIn = () => {
    const currentPercentage = Math.round(stageScale * 100)
    const step = getZoomStep(currentPercentage)
    const newPercentage = Math.min(300, currentPercentage + step)
    const newScale = newPercentage / 100
    updateScale(newScale)
  }

  const handleZoomOut = () => {
    const currentPercentage = Math.round(stageScale * 100)
    const step = getZoomStep(currentPercentage)
    const newPercentage = Math.max(1, currentPercentage - step)
    const newScale = newPercentage / 100
    updateScale(newScale)
  }

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = parseFloat(e.target.value)
    // Clamp to valid range (1% to 300%), default to 100% if invalid
    const clampedPercentage = isNaN(percentage) ? 100 : Math.max(1, Math.min(300, percentage))
    const scale = clampedPercentage / 100
    updateScale(scale)
  }

  const handleZoomBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Reset input to current scale if invalid value was entered
    const currentPercentage = Math.round(stageScale * 100)
    e.target.value = currentPercentage.toString()
  }



  const isAtMinZoom = stageScale <= 0.01
  const isAtMaxZoom = stageScale >= 3

  const currentPercentage = Math.round(stageScale * 100)
  const zoomStep = getZoomStep(currentPercentage)

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2",
      className
    )}>
      <div className="flex items-center space-x-1">
        {/* Zoom Out Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomOut}
          disabled={isAtMinZoom}
          className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom Out (-10%)"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </Button>

        {/* Zoom Level Input */}
        <div className="relative">
          <Input
            type="number"
            value={Math.round(stageScale * 100)}
            onChange={handleZoomChange}
            onBlur={handleZoomBlur}
            className="h-8 w-20 text-xs text-center pr-6"
            step={zoomStep}
            min="1"
            max="300"
          />
          <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            %
          </span>
        </div>

        {/* Zoom In Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleZoomIn}
          disabled={isAtMaxZoom}
          className="h-8 w-8 p-0 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Zoom In (+10%)"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </Button>

      </div>
    </div>
  )
}

export default ZoomWidget
