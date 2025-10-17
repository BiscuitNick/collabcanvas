import React from 'react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { ScrollArea } from '../ui/scroll-area'
// import { Switch } from '../ui/switch'
import { Slider } from '../ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { cn } from '../../lib/utils'
import type { Shape } from '../../types'
import { isRectangle, isCircle, isText } from '../../types'

interface PropertiesPaneProps {
  selectedShape: Shape | null
  onUpdateShape: (updates: Partial<Shape>) => void
  onClose: () => void
  position: 'left' | 'right'
  onMoveToOtherSide: () => void
}

const PropertiesPane: React.FC<PropertiesPaneProps> = ({
  selectedShape,
  onUpdateShape,
  onClose,
  position,
  onMoveToOtherSide
}) => {
  if (!selectedShape) {
    return (
      <div className={cn(
        "h-full bg-white border-gray-200 flex-shrink-0",
        position === 'left' ? 'border-r' : 'border-l'
      )}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Properties</h2>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onMoveToOtherSide}
              >
                {position === 'left' ? '→' : '←'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                ×
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Select a shape to edit its properties
          </p>
        </div>
      </div>
    )
  }

  const handlePositionChange = (field: 'x' | 'y', value: number) => {
    onUpdateShape({ [field]: value })
  }

  const handleSizeChange = (field: 'width' | 'height', value: number) => {
    onUpdateShape({ [field]: value })
  }

  const handleColorChange = (color: string) => {
    onUpdateShape({ fill: color })
  }

  const handleRotationChange = (rotation: number) => {
    onUpdateShape({ rotation })
  }

  return (
    <div className={cn(
      "h-full bg-white border-gray-200 flex-shrink-0 flex flex-col",
      position === 'left' ? 'border-r' : 'border-l'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Properties</h2>
          <div className="flex space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveToOtherSide}
            >
              {position === 'left' ? '→' : '←'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              ×
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          {selectedShape.type === 'rectangle' && 'Rectangle'}
          {selectedShape.type === 'circle' && 'Circle'}
          {selectedShape.type === 'text' && 'Text'}
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Position */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Position</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="x-position">X</Label>
                <Input
                  id="x-position"
                  type="number"
                  value={Math.round(selectedShape.x)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePositionChange('x', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="y-position">Y</Label>
                <Input
                  id="y-position"
                  type="number"
                  value={Math.round(selectedShape.y)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePositionChange('y', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Size */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Size</h3>
            {isRectangle(selectedShape) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={Math.round(selectedShape.width)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSizeChange('width', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={Math.round(selectedShape.height)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSizeChange('height', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
            {isCircle(selectedShape) && (
              <div className="space-y-1">
                <Label htmlFor="radius">Radius</Label>
                <Input
                  id="radius"
                  type="number"
                  value={Math.round(selectedShape.radius)}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateShape({ radius: Number(e.target.value) })}
                />
              </div>
            )}
            {isText(selectedShape) && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="text-width">Width</Label>
                  <Input
                    id="text-width"
                    type="number"
                    value={Math.round(selectedShape.width)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSizeChange('width', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="text-height">Height</Label>
                  <Input
                    id="text-height"
                    type="number"
                    value={Math.round(selectedShape.height)}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleSizeChange('height', Number(e.target.value))}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Appearance */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Appearance</h3>
            <div className="space-y-1">
              <Label htmlFor="fill-color">Fill Color</Label>
              <Input
                id="fill-color"
                type="color"
                value={selectedShape.fill}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange(e.target.value)}
                className="h-10"
              />
            </div>
          </div>

          {/* Text-specific properties */}
          {isText(selectedShape) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Text</h3>
                <div className="space-y-1">
                  <Label htmlFor="text-content">Content</Label>
                  <Input
                    id="text-content"
                    value={selectedShape.text}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateShape({ text: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={selectedShape.fontSize}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => onUpdateShape({ fontSize: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="font-family">Font Family</Label>
                  <Select
                    value={selectedShape.fontFamily}
                    onValueChange={(value: string) => onUpdateShape({ fontFamily: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {/* Rotation */}
          <Separator />
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Rotation</h3>
            <div className="space-y-2">
              <Label>Angle: {Math.round(selectedShape.rotation || 0)}°</Label>
              <Slider
                value={[selectedShape.rotation || 0]}
                onValueChange={([value]: number[]) => handleRotationChange(value)}
                max={360}
                min={0}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

export default PropertiesPane
