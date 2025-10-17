import React from 'react'
import { Button } from '../ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion'
import ContentProperties from './ContentProperties'
import type { Content } from '../../types'
import { isTextContent } from '../../types'
import { getTextExcerpt } from '../../lib/utils'

interface DraggablePropertiesPaneProps {
  content: Content[]
  selectedShape: Content | null
  onUpdateShape: (id: string, updates: Partial<Content>) => void
  onSelectShape: (id: string) => void
  isVisible: boolean
  onClose: () => void
}

const DraggablePropertiesPane: React.FC<DraggablePropertiesPaneProps> = ({
  content,
  selectedShape,
  onUpdateShape,
  onSelectShape,
  isVisible,
  onClose,
}) => {
  if (!isVisible) {
    return null
  }

  // Sort content by creation date
  const sortedContent = [...content].sort((a, b) => {
    const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : (a.createdAt || 0);
    const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : (b.createdAt || 0);
    return dateA - dateB;
  });

  return (
    <div className="w-64 h-full bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
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

      {/* Shape List - Scrollable Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {sortedContent.length > 0 ? (
          <Accordion
            type="single"
            collapsible
            value={selectedShape?.id || ''}
            onValueChange={(value: string) => onSelectShape(value)}
          >
            {sortedContent.map((shape, index) => {
              // Get a better label for text content
              const label = isTextContent(shape)
                ? getTextExcerpt(shape.text, 20)
                : `${shape.type} ${index + 1}`;

              return (
                <AccordionItem value={shape.id} key={shape.id} className="border-b">
                  <AccordionTrigger className="px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                    <span className="font-mono text-gray-500">{shape.type === 'text' ? 'T' : shape.type === 'rectangle' ? '▭' : '○'}</span>
                    <span>{label}</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ContentProperties
                      content={shape}
                      onUpdate={(updates) => onUpdateShape(shape.id, updates)}
                    />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="p-3">
            <p className="text-xs text-gray-500">No content on canvas.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraggablePropertiesPane
