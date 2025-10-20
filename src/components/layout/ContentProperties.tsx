import React from 'react'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Bold, Italic, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import type { Content } from '../../types'
import { isRectangleContent, isCircleContent, isTextContent, isImageContent, isGroupContent, FontFamily, FontStyle } from '../../types'

interface ContentPropertiesProps {
  content: Content
  onUpdate: (updates: Partial<Content>) => void
  readOnly?: boolean
  onBringToFront?: (id: string) => void
  onSendToBack?: (id: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
}

const ContentProperties: React.FC<ContentPropertiesProps> = ({
  content,
  onUpdate,
  readOnly = false,
  onBringToFront,
  onSendToBack,
  onMoveUp,
  onMoveDown
}) => {
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Z-Index Controls */}
      {onBringToFront && onSendToBack && onMoveUp && onMoveDown && !readOnly && (
        <div className="space-y-2">
          <Label className="text-xs">Layer Order</Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onBringToFront(content.id)}
              className="h-7 text-xs"
              title="Bring to Front"
            >
              <ChevronsUp className="h-3 w-3 mr-1" />
              To Front
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendToBack(content.id)}
              className="h-7 text-xs"
              title="Send to Back"
            >
              <ChevronsDown className="h-3 w-3 mr-1" />
              To Back
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMoveUp(content.id)}
              className="h-7 text-xs"
              title="Move Up One Layer"
            >
              <ArrowUp className="h-3 w-3 mr-1" />
              Move Up
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMoveDown(content.id)}
              className="h-7 text-xs"
              title="Move Down One Layer"
            >
              <ArrowDown className="h-3 w-3 mr-1" />
              Move Down
            </Button>
          </div>
        </div>
      )}

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
            disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <Label htmlFor={`${content.id}-fontFamily`} className="text-xs">Font Family</Label>
            <Select
              value={content.fontFamily}
              onValueChange={(value) => handleInputChange('fontFamily', value)}
              disabled={readOnly}
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
                disabled={readOnly}
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
                disabled={readOnly}
              >
                <Italic className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Dimensions */}
      {isRectangleContent(content) && (
        <>
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </div>
          </div>
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
              disabled={readOnly}
            />
          </div>
        </>
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
            disabled={readOnly}
          />
        </div>
      )}

      {/* Image Properties */}
      {isImageContent(content) && (
        <div className="space-y-2">
          <div>
            <Label htmlFor={`${content.id}-src`} className="text-xs">Image URL</Label>
            <Input
              key={`src-${content.id}`}
              id={`${content.id}-src`}
              type="text"
              value={content.src}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('src', e.target.value)}
              className="h-7 text-xs"
              placeholder="https://example.com/image.jpg"
              disabled={readOnly}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`${content.id}-width`} className="text-xs">Width</Label>
              <Input
                key={`width-${content.id}`}
                id={`${content.id}-width`}
                type="number"
                value={Math.round(content.width)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('width', parseInt(e.target.value) || 100)}
                className="h-7 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <Label htmlFor={`${content.id}-height`} className="text-xs">Height</Label>
              <Input
                key={`height-${content.id}`}
                id={`${content.id}-height`}
                type="number"
                value={Math.round(content.height)}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('height', parseInt(e.target.value) || 100)}
                className="h-7 text-xs"
                disabled={readOnly}
              />
            </div>
          </div>
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
              disabled={readOnly}
            />
          </div>
        </div>
      )}

      {/* Group Properties */}
      {isGroupContent(content) && (
        <div className="space-y-2">
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
                disabled={readOnly}
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
                disabled={readOnly}
              />
            </div>
          </div>
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
              disabled={readOnly}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor={`${content.id}-scaleX`} className="text-xs">Scale X</Label>
              <Input
                key={`scaleX-${content.id}`}
                id={`${content.id}-scaleX`}
                type="number"
                step="0.1"
                value={content.scaleX || 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('scaleX', parseFloat(e.target.value) || 1)}
                className="h-7 text-xs"
                disabled={readOnly}
              />
            </div>
            <div>
              <Label htmlFor={`${content.id}-scaleY`} className="text-xs">Scale Y</Label>
              <Input
                key={`scaleY-${content.id}`}
                id={`${content.id}-scaleY`}
                type="number"
                step="0.1"
                value={content.scaleY || 1}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('scaleY', parseFloat(e.target.value) || 1)}
                className="h-7 text-xs"
                disabled={readOnly}
              />
            </div>
          </div>
        </div>
      )}

      {/* Colors */}
      {!isGroupContent(content) && (
      <div>
        <Label htmlFor={`${content.id}-fill`} className="text-xs">{isTextContent(content) ? 'Color' : 'Fill'}</Label>
        <Input
          id={`${content.id}-fill`}
          type="color"
          value={'fill' in content ? content.fill : '#000000'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleColorChange('fill', e.target.value)}
          className="h-10 w-full p-0 border-0 rounded cursor-pointer"
          disabled={readOnly}
        />
      </div>
      )}

    </div>
  )
}

export default ContentProperties
