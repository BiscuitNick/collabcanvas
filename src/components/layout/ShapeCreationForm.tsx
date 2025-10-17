import React, { useState, useEffect } from 'react'
import { Input } from '../ui/input'
import { DEFAULT_SHAPE_VALUES } from '../../types'
import { ShapeType } from '../../types'

interface ShapeCreationFormProps {
  selectedShape: ShapeType | null
  onShapeCreate: (options: {
    type: 'rectangle' | 'circle' | 'image'
    width?: number
    height?: number
    radius?: number
    fill: string
    stroke: string
    strokeWidth: number
  }) => void
}

const ShapeCreationForm: React.FC<ShapeCreationFormProps> = ({
  selectedShape,
  onShapeCreate
}) => {
  const [formData, setFormData] = useState<{
    width: number
    height: number
    radius: number
    fill: string
  }>({
    width: DEFAULT_SHAPE_VALUES.rectangle.width,
    height: DEFAULT_SHAPE_VALUES.rectangle.height,
    radius: DEFAULT_SHAPE_VALUES.circle.radius,
    fill: DEFAULT_SHAPE_VALUES.rectangle.fill
  })

  // Update form data when shape type changes
  useEffect(() => {
    if (selectedShape === 'rectangle') {
      setFormData({
        width: DEFAULT_SHAPE_VALUES.rectangle.width,
        height: DEFAULT_SHAPE_VALUES.rectangle.height,
        radius: DEFAULT_SHAPE_VALUES.circle.radius,
        fill: DEFAULT_SHAPE_VALUES.rectangle.fill
      })
    } else if (selectedShape === 'circle') {
      setFormData({
        width: DEFAULT_SHAPE_VALUES.rectangle.width,
        height: DEFAULT_SHAPE_VALUES.rectangle.height,
        radius: DEFAULT_SHAPE_VALUES.circle.radius,
        fill: DEFAULT_SHAPE_VALUES.circle.fill
      })
    }
  }, [selectedShape])

  // Load saved values from localStorage
  useEffect(() => {
    const savedValues = localStorage.getItem('collabcanvas-shape-creation')
    if (savedValues) {
      try {
        const parsed = JSON.parse(savedValues)
        setFormData(prev => ({ ...prev, ...parsed }))
      } catch (error) {
        console.warn('Failed to parse saved shape creation values:', error)
      }
    }
  }, [])

  // Save values to localStorage
  const saveValues = (values: typeof formData) => {
    localStorage.setItem('collabcanvas-shape-creation', JSON.stringify(values))
  }

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    const newValues = { ...formData, [field]: value }
    setFormData(newValues)
    saveValues(newValues)
  }

  // Automatically enter creation mode when form values change or shape type is selected
  useEffect(() => {
    if (selectedShape) {
      onShapeCreate({
        type: selectedShape,
        width: selectedShape === 'rectangle' ? formData.width : undefined,
        height: selectedShape === 'rectangle' ? formData.height : undefined,
        radius: selectedShape === 'circle' ? formData.radius : undefined,
        fill: formData.fill,
        stroke: formData.fill, // Use fill color as stroke for now
        strokeWidth: 0 // No stroke width for now
      })
    }
  }, [formData, selectedShape, onShapeCreate])

  if (!selectedShape || (selectedShape !== 'rectangle' && selectedShape !== 'circle')) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {selectedShape === 'rectangle' && (
        <>
          <div className="flex items-center px-2 h-8 border border-gray-300 rounded-md bg-white">
            <span className="text-xs font-medium text-gray-500 mr-2">W</span>
            <Input
              id="width"
              type="number"
              value={formData.width}
              onChange={(e) => handleInputChange('width', parseInt(e.target.value) || 0)}
              className="h-6 w-12 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
          <div className="flex items-center px-2 h-8 border border-gray-300 rounded-md bg-white">
            <span className="text-xs font-medium text-gray-500 mr-2">H</span>
            <Input
              id="height"
              type="number"
              value={formData.height}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
              className="h-6 w-12 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
            />
          </div>
        </>
      )}

      {selectedShape === 'circle' && (
        <div className="flex items-center px-2 h-8 border border-gray-300 rounded-md bg-white">
          <span className="text-xs font-medium text-gray-500 mr-2">R</span>
          <Input
            id="radius"
            type="number"
            value={formData.radius}
            onChange={(e) => handleInputChange('radius', parseInt(e.target.value) || 0)}
            className="h-6 w-12 text-xs border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
          />
        </div>
      )}

      <div className="flex items-center px-2 h-8 border border-gray-300 rounded-md bg-white">
        <Input
          id="fill"
          type="color"
          value={formData.fill}
          onChange={(e) => handleInputChange('fill', e.target.value)}
          className="h-6 w-6 p-0 border-none bg-transparent cursor-pointer"
          title="Fill Color"
        />
      </div>
    </div>
  )
}

export default ShapeCreationForm
