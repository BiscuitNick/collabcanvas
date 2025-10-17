import React from 'react'
import { Button } from '../ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import ShapeProperties from './ShapeProperties'
import type { Shape } from '../../types'

interface DraggablePropertiesPaneProps {
  shapes: Shape[]
  selectedShape: Shape | null
  onUpdateShape: (id: string, updates: Partial<Shape>) => void
  onSelectShape: (id: string) => void
  isVisible: boolean
  onClose: () => void
}

const DraggablePropertiesPane: React.FC<DraggablePropertiesPaneProps> = ({
  shapes,
  selectedShape,
  onUpdateShape,
  onSelectShape,
  isVisible,
  onClose,
}) => {
  if (!isVisible) {
    return null
  }

  // Sort shapes by creation date
  const sortedShapes = [...shapes].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt || 0);
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt || 0);
    return dateA - dateB;
  });

  return (
    <div className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Layers</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
          title="Close Properties Panel"
        >
          ✕
        </Button>
      </div>

      {/* Shape List */}
      <div className="flex-1 overflow-y-auto">
        {sortedShapes.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            value={selectedShape?.id || ''}
            onValueChange={(value: string) => onSelectShape(value)}
          >
            {sortedShapes.map((shape, index) => (
              <AccordionItem value={shape.id} key={shape.id} className="border-b">
                <AccordionTrigger className="px-3 py-2 text-xs hover:bg-gray-50">
                  {`Shape ${index + 1}: ${shape.type}`}
                </AccordionTrigger>
                <AccordionContent>
                  <ShapeProperties
                    shape={shape}
                    onUpdate={(updates) => onUpdateShape(shape.id, updates)}
                  />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <p className="p-3 text-xs text-gray-500">No shapes on canvas.</p>
        )}
      </div>
    </div>
  )
}

export default DraggablePropertiesPane
