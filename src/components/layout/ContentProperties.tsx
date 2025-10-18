import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Bold, Italic } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import type { Content } from '../../types'
import { isRectangleContent, isCircleContent, isTextContent, FontFamily, FontStyle } from '../../types'

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
      {/* Position */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${content.id}-x`} className="text-xs">X</Label>
          <Input
            key={`x-${content.id}`}
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
            key={`y-${content.id}`}
            id={`${content.id}-y`}
            type="number"
            value={Math.round(content.y)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('y', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      </div>

      {/* Text Content */}
      {isTextContent(content) && (
        <div>
          <Label htmlFor={`${content.id}-text`} className="text-xs">Text</Label>
          <Textarea
            id={`${content.id}-text`}
            value={content.text}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('text', e.target.value)}
            className="h-16 text-xs resize-none"
            placeholder="Enter text..."
          />
        </div>
      )}

      {/* Font Properties */}
      {isTextContent(content) && (
        <div className="space-y-2">
          {/* Font Size and Rotation - same row for text */}
          <div className="grid grid-cols-2 gap-2">
            {/* Font Size */}
            <div>
              <Label htmlFor={`${content.id}-fontSize`} className="text-xs">Font Size</Label>
              <Input
                key={`fontSize-${content.id}`}
                id={`${content.id}-fontSize`}
                type="number"
                value={Math.round(content.fontSize)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('fontSize', parseInt(e.target.value) || 24)}
                className="h-7 text-xs"
                min="8"
                placeholder="24 px"
              />
            </div>

            {/* Rotation */}
            <div>
              <Label htmlFor={`${content.id}-rotation`} className="text-xs">Rotation</Label>
              <Input
                key={`rotation-${content.id}`}
                id={`${content.id}-rotation`}
                type="number"
                value={Math.round(content.rotation || 0)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('rotation', parseInt(e.target.value) || 0)}
                className="h-7 text-xs"
                placeholder="0°"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label htmlFor={`${content.id}-fontFamily`} className="text-xs">Font Family</Label>
            <Select
              value={content.fontFamily}
              onValueChange={(value) => handleInputChange('fontFamily', value)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value={FontFamily.ARIAL}>Arial</SelectItem>
                <SelectItem value={FontFamily.HELVETICA}>Helvetica</SelectItem>
                <SelectItem value={FontFamily.TIMES_NEW_ROMAN}>Times</SelectItem>
                <SelectItem value={FontFamily.COURIER}>Courier</SelectItem>
                <SelectItem value={FontFamily.GEORGIA}>Georgia</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Font Style */}
          <div>
            <Label className="text-xs">Font Style</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentStyle = content.fontStyle as string
                  const newStyle = currentStyle === FontStyle.BOLD || currentStyle === FontStyle.BOLD_ITALIC
                    ? currentStyle === FontStyle.BOLD ? FontStyle.NORMAL : FontStyle.ITALIC
                    : currentStyle === FontStyle.ITALIC ? FontStyle.BOLD_ITALIC : FontStyle.BOLD
                  handleInputChange('fontStyle', newStyle)
                }}
                className={`h-7 flex-1 ${((content.fontStyle as string) === FontStyle.BOLD || (content.fontStyle as string) === FontStyle.BOLD_ITALIC) ? 'bg-gray-200' : ''}`}
              >
                <Bold className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const currentStyle = content.fontStyle as string
                  const newStyle = currentStyle === FontStyle.ITALIC || currentStyle === FontStyle.BOLD_ITALIC
                    ? currentStyle === FontStyle.ITALIC ? FontStyle.NORMAL : FontStyle.BOLD
                    : currentStyle === FontStyle.BOLD ? FontStyle.BOLD_ITALIC : FontStyle.ITALIC
                  handleInputChange('fontStyle', newStyle)
                }}
                className={`h-7 flex-1 ${((content.fontStyle as string) === FontStyle.ITALIC || (content.fontStyle as string) === FontStyle.BOLD_ITALIC) ? 'bg-gray-200' : ''}`}
              >
                <Italic className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions */}
      {isRectangleContent(content) && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor={`${content.id}-width`} className="text-xs">Width</Label>
            <Input
              key={`width-${content.id}`}
              id={`${content.id}-width`}
              type="number"
              value={Math.round(content.width)}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('width', parseInt(e.target.value) || 0)}
              className="h-7 text-xs"
            />
          </div>
          <div>
            <Label htmlFor={`${content.id}-height`} className="text-xs">Height</Label>
            <Input
              key={`height-${content.id}`}
              id={`${content.id}-height`}
              type="number"
              value={Math.round(content.height)}
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
            key={`radius-${content.id}`}
            id={`${content.id}-radius`}
            type="number"
            value={Math.round(content.radius)}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('radius', parseInt(e.target.value) || 0)}
            className="h-7 text-xs"
          />
        </div>
      )}

      {/* Colors */}
      <div>
        <Label htmlFor={`${content.id}-fill`} className="text-xs">{isTextContent(content) ? 'Color' : 'Fill'}</Label>
        <Input
          id={`${content.id}-fill`}
          type="color"
          value={'fill' in content ? content.fill : '#000000'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('fill', e.target.value)}
          className="h-10 w-full p-0 border-0 rounded cursor-pointer"
        />
      </div>

    </div>
  )
}

export default ContentProperties
