import React, { useState, useEffect } from 'react'
import { useCanvasStore } from '../../store/canvasStore'

interface RectanglePropertiesProps {
  selectedShapeId: string | null
}

const RectangleProperties: React.FC<RectanglePropertiesProps> = ({ selectedShapeId }) => {
  const { shapes, updateShape } = useCanvasStore()
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [x, setX] = useState('')
  const [y, setY] = useState('')
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
      setFill(selectedShape.fill)
    } else {
      setWidth('')
      setHeight('')
      setX('')
      setY('')
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
        const clampedWidth = Math.min(1000, Math.max(20, numValue))
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
        const clampedHeight = Math.min(1000, Math.max(20, numValue))
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
        const clampedX = Math.min(2500, Math.max(-2500, numValue))
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
        const clampedY = Math.min(2500, Math.max(-2500, numValue))
        const roundedY = Math.round(clampedY)
        updateShape(selectedShapeId, { y: roundedY })
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

  if (!selectedShape) {
    return null
  }

  return (
    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded px-3 py-2 shadow-sm">
      <span className="text-sm font-medium text-gray-700">Properties:</span>
      
      {/* Position */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">X:</label>
        <input
          type="number"
          value={x}
          onChange={handleXChange}
          onBlur={handleXBlur}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="X"
        />
      </div>
      
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Y:</label>
        <input
          type="number"
          value={y}
          onChange={handleYChange}
          onBlur={handleYBlur}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Y"
        />
      </div>

      {/* Size */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">W:</label>
        <input
          type="number"
          value={width}
          onChange={handleWidthChange}
          onBlur={handleWidthBlur}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="W"
          min="20"
          max="1000"
        />
      </div>
      
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">H:</label>
        <input
          type="number"
          value={height}
          onChange={handleHeightChange}
          onBlur={handleHeightBlur}
          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="H"
          min="20"
          max="1000"
        />
      </div>

      {/* Color */}
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-500">Color:</label>
        <input
          type="color"
          value={fill}
          onChange={handleFillChange}
          className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
          title="Choose color"
        />
      </div>
    </div>
  )
}

export default RectangleProperties
