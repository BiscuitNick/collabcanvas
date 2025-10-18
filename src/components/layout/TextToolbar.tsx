import React, { useState, useEffect } from 'react'
import { Input } from '../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { Bold, Italic } from 'lucide-react'
import { FontFamily, FontStyle } from '../../types'

interface TextToolbarProps {
  onTextOptionsChange: (options: {
    text: string
    fontSize: number
    fontFamily: FontFamily
    fontStyle: FontStyle
  }) => void
}

const DEFAULT_TEXT_VALUES = {
  text: 'hello world',
  fontSize: 24,
  fontFamily: FontFamily.ARIAL,
  fontStyle: FontStyle.NORMAL,
}

const TextToolbar: React.FC<TextToolbarProps> = ({ onTextOptionsChange }) => {
  const [formData, setFormData] = useState(DEFAULT_TEXT_VALUES)

  // Load saved values from localStorage
  useEffect(() => {
    const savedValues = localStorage.getItem('collabcanvas-text-creation')
    if (savedValues) {
      try {
        const parsed = JSON.parse(savedValues)
        setFormData(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse saved text creation values:', error)
      }
    }
  }, [])

  // Save values to localStorage and notify parent
  const saveValues = (values: typeof formData) => {
    localStorage.setItem('collabcanvas-text-creation', JSON.stringify(values))
    onTextOptionsChange(values)
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number | FontFamily | FontStyle) => {
    const newValues = { ...formData, [field]: value }
    setFormData(newValues)
    saveValues(newValues)
  }

  const toggleBold = () => {
    const currentStyle = formData.fontStyle as string
    const newStyle = currentStyle === FontStyle.BOLD || currentStyle === FontStyle.BOLD_ITALIC
      ? currentStyle === FontStyle.BOLD ? FontStyle.NORMAL : FontStyle.ITALIC
      : currentStyle === FontStyle.ITALIC ? FontStyle.BOLD_ITALIC : FontStyle.BOLD
    handleInputChange('fontStyle', newStyle as FontStyle)
  }

  const toggleItalic = () => {
    const currentStyle = formData.fontStyle as string
    const newStyle = currentStyle === FontStyle.ITALIC || currentStyle === FontStyle.BOLD_ITALIC
      ? currentStyle === FontStyle.ITALIC ? FontStyle.NORMAL : FontStyle.BOLD
      : currentStyle === FontStyle.BOLD ? FontStyle.BOLD_ITALIC : FontStyle.ITALIC
    handleInputChange('fontStyle', newStyle as FontStyle)
  }

  const isBold = (formData.fontStyle as string) === FontStyle.BOLD || (formData.fontStyle as string) === FontStyle.BOLD_ITALIC
  const isItalic = (formData.fontStyle as string) === FontStyle.ITALIC || (formData.fontStyle as string) === FontStyle.BOLD_ITALIC

  // Notify parent when component mounts or formData changes
  useEffect(() => {
    onTextOptionsChange(formData)
  }, [formData, onTextOptionsChange])

  return (
    <div className="flex items-center gap-2">
      {/* Font Family */}
      <Select
        value={formData.fontFamily}
        onValueChange={(value) => handleInputChange('fontFamily', value as FontFamily)}
      >
        <SelectTrigger className="h-8 w-32 text-xs">
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

      {/* Font Size */}
      <div className="flex items-center px-2 h-8 border border-gray-300 rounded-md bg-white">
        <Input
          id="fontSize"
          type="number"
          value={formData.fontSize}
          onChange={(e) => handleInputChange('fontSize', parseInt(e.target.value) || 24)}
          className="h-6 w-12 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          min="8"
          max="200"
        />
        <span className="text-xs text-gray-400 ml-1">px</span>
      </div>

      {/* Bold Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleBold}
        className={`h-8 w-8 p-0 ${isBold ? 'bg-gray-200' : ''}`}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>

      {/* Italic Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={toggleItalic}
        className={`h-8 w-8 p-0 ${isItalic ? 'bg-gray-200' : ''}`}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default TextToolbar
