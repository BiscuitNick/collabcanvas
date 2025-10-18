import React, { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import ContentProperties from './ContentProperties'
import type { Content } from '../../types'
import { isTextContent, isRectangleContent, isCircleContent } from '../../types'
import { getTextExcerpt, formatTimeAgo } from '../../lib/utils'
import { Lock } from 'lucide-react'

interface DraggablePropertiesPaneProps {
  content: Content[]
  selectedShape: Content | null
  onUpdateShape: (id: string, updates: Partial<Content>) => void
  onSelectShape: (id: string) => void
  onPanToContent?: (x: number, y: number) => void
  isVisible: boolean
  onClose: () => void
  currentUserId?: string
  users?: Map<string, { displayName?: string; email?: string; color?: string }>
}

const DraggablePropertiesPane: React.FC<DraggablePropertiesPaneProps> = ({
  content,
  selectedShape,
  onUpdateShape,
  onSelectShape,
  onPanToContent,
  isVisible,
  onClose,
  currentUserId,
  users,
}) => {
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(null)

  // Handle item header click - toggle expand/collapse or select
  const handleHeaderClick = (shapeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (expandedItemId === shapeId) {
      // Collapse if already expanded
      setExpandedItemId(null)
    } else {
      // Select and expand
      onSelectShape(shapeId)
      setExpandedItemId(shapeId)
      // Pan to the content when selected
      const shape = content.find(c => c.id === shapeId)
      if (shape && onPanToContent) {
        onPanToContent(shape.x, shape.y)
      }
    }
  }

  // Helper to get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Get the fill color of a shape
  const getShapeFillColor = (shape: Content): string => {
    if (isRectangleContent(shape) || isCircleContent(shape)) {
      return shape.fill || '#gray'
    }
    if (isTextContent(shape)) {
      return shape.fill || '#black'
    }
    return '#gray'
  }

  // Render filled shape icon based on content type
  const renderShapeIcon = (shape: Content): React.ReactNode => {
    const fillColor = getShapeFillColor(shape)
    const iconSize = 'h-4 w-4'

    if (isTextContent(shape)) {
      return <span className="text-xs font-bold" style={{ color: fillColor }}>A</span>
    }
    if (isRectangleContent(shape)) {
      return <div className={`${iconSize} rounded-sm`} style={{ backgroundColor: fillColor }}></div>
    }
    if (isCircleContent(shape)) {
      return <div className={`${iconSize} rounded-full`} style={{ backgroundColor: fillColor }}></div>
    }
    return null
  }

  // Scroll to selected item when selection changes
  useEffect(() => {
    if (selectedShape && selectedItemRef.current && scrollContainerRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }, [selectedShape?.id])

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
    <div className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg flex flex-col overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 flex-shrink-0">
        <h3 className="text-xs font-semibold text-gray-700">Layers</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0 hover:bg-gray-100"
          title="Close Layers Panel"
        >
          ✕
        </Button>
      </div>

      {/* Shape List - Scrollable Content */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0 p-3 space-y-1.5 w-full">
        {sortedContent.length > 0 ? (
          sortedContent.map((shape) => {
            const label = isTextContent(shape)
              ? getTextExcerpt(shape.text, 20)
              : shape.type

            const isSelected = selectedShape?.id === shape.id
            const isLockedByOther = shape.lockedByUserId && shape.lockedByUserId !== currentUserId
            const isLockedBySelf = shape.lockedByUserId && shape.lockedByUserId === currentUserId

            // Get the user who locked this shape
            let lockedByUserName = ''
            let lockedByUserColor = ''
            if (shape.lockedByUserId && users) {
              const user = users.get(shape.lockedByUserId)
              lockedByUserName = user?.displayName || user?.email || 'Unknown User'
              lockedByUserColor = user?.color || '#999'
            }

            // Get last edited info
            let lastEditedByUserName = ''
            let lastEditedByUserColor = ''
            if (shape.lastEditedBy && users) {
              const user = users.get(shape.lastEditedBy)
              lastEditedByUserName = user?.displayName || user?.email || 'Unknown User'
              lastEditedByUserColor = user?.color || '#999'
            }

            // Get last interaction info
            let lastInteractedByUserName = ''
            let lastInteractedByUserColor = ''
            if (shape.lastInteractedBy && users) {
              const user = users.get(shape.lastInteractedBy)
              lastInteractedByUserName = user?.displayName || user?.email || 'Unknown User'
              lastInteractedByUserColor = user?.color || '#999'
            }

            const isExpanded = expandedItemId === shape.id

            return (
              <div
                key={shape.id}
                ref={isSelected ? selectedItemRef : null}
                className={`rounded cursor-pointer transition-colors w-full overflow-hidden ${
                  isExpanded ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                } ${isLockedByOther ? 'opacity-60' : ''}`}
              >
                {/* Main content row - clickable header */}
                <div
                  className="py-2 px-2 flex items-center justify-between gap-2 min-w-0"
                  onClick={(e) => handleHeaderClick(shape.id, e)}
                >
                  {/* Left side: icon and label */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex-shrink-0">
                      {renderShapeIcon(shape)}
                    </div>
                    <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
                  </div>

                  {/* Right side: lock icon, lock avatar, or empty space */}
                  {isLockedBySelf ? (
                    <div className="flex-shrink-0 text-blue-500">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  ) : isLockedByOther ? (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Lock className="h-3.5 w-3.5 text-red-500" />
                      <Avatar className="h-5 w-5">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{ backgroundColor: lockedByUserColor, color: 'white' }}
                        >
                          {getInitials(lockedByUserName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : null}
                </div>

                {/* Bottom row: last edited info */}
                {shape.lastEditedBy && (
                  <div className="mt-1 flex items-center gap-1.5 min-w-0">
                    <Avatar className="h-4 w-4 flex-shrink-0">
                      <AvatarFallback
                        className="text-xs font-semibold leading-none"
                        style={{ backgroundColor: lastEditedByUserColor, color: 'white' }}
                      >
                        {getInitials(lastEditedByUserName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-gray-500 truncate">
                      {lastEditedByUserName} • {formatTimeAgo(shape.lastEditedAt)}
                    </span>
                  </div>
                )}

                {/* Content properties - only show if expanded and not locked by someone else */}
                {!isLockedByOther && isExpanded && (
                  <div className="px-2 pb-2 pt-2 border-t border-gray-200">
                    <ContentProperties
                      content={shape}
                      onUpdate={(updates) => onUpdateShape(shape.id, updates)}
                    />
                  </div>
                )}

                {/* Last interaction info - shown at bottom of properties when expanded */}
                {isExpanded && shape.lastInteractedBy && (
                  <div className="px-2 pb-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Avatar className="h-4 w-4 flex-shrink-0">
                        <AvatarFallback
                          className="text-xs font-semibold leading-none"
                          style={{ backgroundColor: lastInteractedByUserColor, color: 'white' }}
                        >
                          {getInitials(lastInteractedByUserName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-500 truncate">
                        {lastInteractedByUserName} • {formatTimeAgo(shape.lastInteractedAt)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Locked by other user message */}
                {isLockedByOther && isExpanded && (
                  <div className="px-2 pb-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5 flex-shrink-0">
                        <AvatarFallback
                          className="text-xs font-semibold"
                          style={{ backgroundColor: lockedByUserColor, color: 'white' }}
                        >
                          {getInitials(lockedByUserName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{lockedByUserName}</p>
                        <p className="text-xs text-gray-500">Cannot edit</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-gray-500">No content on canvas.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraggablePropertiesPane
