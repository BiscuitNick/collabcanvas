import React, { useState, useEffect } from 'react'
import { useShapes } from '../../hooks/useShapes'
import { MIN_SHAPE_SIZE, MAX_SHAPE_SIZE, CANVAS_HALF } from '../../lib/constants'

interface RectanglePropertiesProps {
  selectedShapeId: string | null
}

const RectangleProperties: React.FC<RectanglePropertiesProps> = ({ selectedShapeId }) => {
  const { shapes, updateShape } = useShapes()
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [x, setX] = useState('')
  const [y, setY] = useState('')
  const [rotation, setRotation] = useState('')
  const [fill, setFill] = useState('')

  // Get the selected shape
  const selectedShape = selectedShapeId ? shapes.find(shape => shape.id === selectedShapeId) : null

  // Update inputs when selected shape changes
  useEffect(() => {
    if (selectedShape) {
      setWidth(Math.round(selectedShape.width).toString())
      setHeight(Math.round(selectedShape.height).toString())
      setX(Math.round(selectedShape.x).toString())
      setY(Math.round(selectedShape.y).toString())
      setRotation(Math.round(selectedShape.rotation).toString())
      setFill(selectedShape.fill)
    } else {
      setWidth('')
      setHeight('')
      setX('')
      setY('')
      setRotation('')
      setFill('')
    }
  }, [selectedShape])

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setWidth(value)
    
    if (selectedShapeId && value) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        // Clamp within bounds and round to nearest integer
        const clampedWidth = Math.min(MAX_SHAPE_SIZE, Math.max(MIN_SHAPE_SIZE, numValue))
        const roundedWidth = Math.round(clampedWidth)
        updateShape(selectedShapeId, { width: roundedWidth })
      }
    }
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setHeight(value)
    
    if (selectedShapeId && value) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue > 0) {
        // Clamp within bounds and round to nearest integer
        const clampedHeight = Math.min(MAX_SHAPE_SIZE, Math.max(MIN_SHAPE_SIZE, numValue))
        const roundedHeight = Math.round(clampedHeight)
        updateShape(selectedShapeId, { height: roundedHeight })
      }
    }
  }

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setX(value)
    
    if (selectedShapeId && value) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        // Clamp within canvas bounds and round to nearest integer
        const clampedX = Math.min(CANVAS_HALF, Math.max(-CANVAS_HALF, numValue))
        const roundedX = Math.round(clampedX)
        updateShape(selectedShapeId, { x: roundedX })
      }
    }
  }

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setY(value)
    
    if (selectedShapeId && value) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        // Clamp within canvas bounds and round to nearest integer
        const clampedY = Math.min(CANVAS_HALF, Math.max(-CANVAS_HALF, numValue))
        const roundedY = Math.round(clampedY)
        updateShape(selectedShapeId, { y: roundedY })
      }
    }
  }

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setRotation(value)
    
    if (selectedShapeId && value) {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        // Clamp rotation between 0 and 360 degrees and round to nearest integer
        const clampedRotation = ((numValue % 360) + 360) % 360 // Normalize to 0-360
        const roundedRotation = Math.round(clampedRotation)
        updateShape(selectedShapeId, { rotation: roundedRotation })
      }
    }
  }

  const handleFillChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFill(value)
    
    if (selectedShapeId && value) {
      updateShape(selectedShapeId, { fill: value })
    }
  }

  const handleWidthBlur = () => {
    if (selectedShape) {
      const numValue = parseFloat(width)
      if (isNaN(numValue) || numValue <= 0) {
        setWidth(Math.round(selectedShape.width).toString())
      }
    }
  }

  const handleHeightBlur = () => {
    if (selectedShape) {
      const numValue = parseFloat(height)
      if (isNaN(numValue) || numValue <= 0) {
        setHeight(Math.round(selectedShape.height).toString())
      }
    }
  }

  const handleXBlur = () => {
    if (selectedShape) {
      const numValue = parseFloat(x)
      if (isNaN(numValue)) {
        setX(Math.round(selectedShape.x).toString())
      }
    }
  }

  const handleYBlur = () => {
    if (selectedShape) {
      const numValue = parseFloat(y)
      if (isNaN(numValue)) {
        setY(Math.round(selectedShape.y).toString())
      }
    }
  }

  const handleRotationBlur = () => {
    if (selectedShape) {
      const numValue = parseFloat(rotation)
      if (isNaN(numValue)) {
        setRotation(Math.round(selectedShape.rotation).toString())
      }
    }
  }

  if (!selectedShape) {
    return null
  }

  return (
    <div className="space-y-3 bg-white border border-gray-300 rounded p-3 shadow-sm">
      {/* Position */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Position</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-6">X:</label>
            <input
              type="number"
              value={x}
              onChange={handleXChange}
              onBlur={handleXBlur}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="X"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-6">Y:</label>
            <input
              type="number"
              value={y}
              onChange={handleYChange}
              onBlur={handleYBlur}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Y"
            />
          </div>
        </div>
      </div>

      {/* Size */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Size</label>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-6">W:</label>
            <input
              type="number"
              value={width}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="W"
              min={MIN_SHAPE_SIZE}
              max={MAX_SHAPE_SIZE}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-6">H:</label>
            <input
              type="number"
              value={height}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="H"
              min={MIN_SHAPE_SIZE}
              max={MAX_SHAPE_SIZE}
            />
          </div>
        </div>
      </div>

      {/* Rotation */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Rotation</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={rotation}
            onChange={handleRotationChange}
            onBlur={handleRotationBlur}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="0"
            min="0"
            max="360"
            step="1"
          />
          <span className="text-xs text-gray-500">degrees</span>
        </div>
      </div>

      {/* Color */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Color</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={fill}
            onChange={handleFillChange}
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            title="Choose color"
          />
          <span className="text-xs text-gray-500 font-mono">{fill}</span>
        </div>
      </div>
    </div>
  )
}

export default RectangleProperties
