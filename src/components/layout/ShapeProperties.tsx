import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import type { Shape } from '../../types'
import { isRectangle, isCircle } from '../../types'

interface ShapePropertiesProps {
  shape: Shape
  onUpdate: (updates: Partial<Shape>) => void
}

const ShapeProperties: React.FC<ShapePropertiesProps> = ({ shape, onUpdate }) => {
  const handleInputChange = (field: string, value: string | number) => {
    onUpdate({ [field]: value } as Partial<Shape>)
  }

  const handleColorChange = (field: 'fill' | 'stroke', value: string) => {
    onUpdate({ [field]: value })
  }

  return (
    <div className="space-y-3 p-1">
      <h4 className="text-xs font-medium text-gray-500">Properties</h4>

      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${shape.id}-x`} className="text-xs">X</Label>
          <Input
            id={`${shape.id}-x`}
            type="number"
            value={Math.round(shape.x)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('x', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${shape.id}-y`} className="text-xs">Y</Label>
          <Input
            id={`${shape.id}-y`}
            type="number"
            value={Math.round(shape.y)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('y', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Dimensions */}
      {isRectangle(shape) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${shape.id}-width`} className="text-xs">Width</Label>
            <Input
              id={`${shape.id}-width`}
              type="number"
              value={shape.width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('width', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${shape.id}-height`} className="text-xs">Height</Label>
            <Input
              id={`${shape.id}-height`}
              type="number"
              value={shape.height}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('height', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
      {isCircle(shape) && (
        <div>
          <Label htmlFor={`${shape.id}-radius`} className="text-xs">Radius</Label>
          <Input
            id={`${shape.id}-radius`}
            type="number"
            value={shape.radius}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('radius', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${shape.id}-fill`} className="text-xs">Fill</Label>
          <Input
            id={`${shape.id}-fill`}
            type="color"
            value={shape.fill}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('fill', e.target.value)}
            className="h-7 w-full p-1"
          />
        </div>
        <div>
          <Label htmlFor={`${shape.id}-stroke`} className="text-xs">Stroke</Label>
          <Input
            id={`${shape.id}-stroke`}
            type="color"
            value={'stroke' in shape ? shape.stroke || '#000000' : '#000000'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('stroke', e.target.value)}
            className="h-7 w-full p-1"
          />
        </div>
      </div>
      
      {/* Stroke Width & Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${shape.id}-strokeWidth`} className="text-xs">Stroke Width</Label>
          <Input
            id={`${shape.id}-strokeWidth`}
            type="number"
            value={'strokeWidth' in shape ? shape.strokeWidth || 0 : 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('strokeWidth', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
            min="0"
          />
        </div>
        <div>
          <Label htmlFor={`${shape.id}-rotation`} className="text-xs">Rotation</Label>
          <Input
            id={`${shape.id}-rotation`}
            type="number"
            value={Math.round(shape.rotation || 0)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rotation', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

export default ShapeProperties
