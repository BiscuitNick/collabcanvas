import React from 'react'
import Rectangle from './Rectangle'
import Circle from './Circle'
import type { Shape, Rectangle as RectangleType, Circle as CircleType } from '../../types'
import { isRectangle, isCircle } from '../../types'

interface ShapeFactoryProps {
  shape: Shape
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Shape>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
}

/**
 * ShapeFactory component dynamically renders the appropriate shape component
 * based on the shape type. This provides a unified interface for rendering
 * different shape types while maintaining type safety.
 */
const ShapeFactory: React.FC<ShapeFactoryProps> = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  currentUserId,
}) => {
  // Handle null or undefined shapes
  if (!shape) {
    console.warn('ShapeFactory received null or undefined shape')
    return null
  }

  // Render Rectangle component
  if (isRectangle(shape)) {
    return (
      <Rectangle
        shape={shape as RectangleType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<RectangleType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
      />
    )
  }

  // Render Circle component
  if (isCircle(shape)) {
    return (
      <Circle
        shape={shape as CircleType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<CircleType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
      />
    )
  }


  // Fallback for unknown shape types
  console.warn('Unknown shape type:', shape)
  return null
}

ShapeFactory.displayName = 'ShapeFactory'

export default ShapeFactory
