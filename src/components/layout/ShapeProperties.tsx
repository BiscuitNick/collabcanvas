import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import type { Content } from '../../types'
import { isRectangleContent, isCircleContent } from '../../types'

interface ContentPropertiesProps {
  content: Content
  onUpdate: (updates: Partial<Content>) => void
}

const ContentProperties: React.FC<ContentPropertiesProps> = ({ content, onUpdate }) => {
  const handleInputChange = (field: string, value: string | number) => {
    onUpdate({ [field]: value } as Partial<Content>)
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
          <Label htmlFor={`${content.id}-x`} className="text-xs">X</Label>
          <Input
            id={`${content.id}-x`}
            type="number"
            value={Math.round(content.x)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('x', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
        <div>
          <Label htmlFor={`${content.id}-y`} className="text-xs">Y</Label>
          <Input
            id={`${content.id}-y`}
            type="number"
            value={Math.round(content.y)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('y', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Dimensions */}
      {isRectangleContent(content) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${content.id}-width`} className="text-xs">Width</Label>
            <Input
              id={`${content.id}-width`}
              type="number"
              value={content.width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('width', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${content.id}-height`} className="text-xs">Height</Label>
            <Input
              id={`${content.id}-height`}
              type="number"
              value={content.height}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('height', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
        </div>
      )}
      {isCircleContent(content) && (
        <div>
          <Label htmlFor={`${content.id}-radius`} className="text-xs">Radius</Label>
          <Input
            id={`${content.id}-radius`}
            type="number"
            value={content.radius}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('radius', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Colors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${content.id}-fill`} className="text-xs">Fill</Label>
          <Input
            id={`${content.id}-fill`}
            type="color"
            value={'fill' in content ? content.fill : '#000000'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('fill', e.target.value)}
            className="h-7 w-full p-1"
          />
        </div>
        <div>
          <Label htmlFor={`${content.id}-stroke`} className="text-xs">Stroke</Label>
          <Input
            id={`${content.id}-stroke`}
            type="color"
            value={'stroke' in content ? content.stroke || '#000000' : '#000000'}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('stroke', e.target.value)}
            className="h-7 w-full p-1"
          />
        </div>
      </div>
      
      {/* Stroke Width & Rotation */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${content.id}-strokeWidth`} className="text-xs">Stroke Width</Label>
          <Input
            id={`${content.id}-strokeWidth`}
            type="number"
            value={'strokeWidth' in content ? content.strokeWidth || 0 : 0}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('strokeWidth', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
            min="0"
          />
        </div>
        <div>
          <Label htmlFor={`${content.id}-rotation`} className="text-xs">Rotation</Label>
          <Input
            id={`${content.id}-rotation`}
            type="number"
            value={Math.round(content.rotation || 0)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rotation', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>
    </div>
  )
}

export default ContentProperties
