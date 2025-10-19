import React, { useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { Avatar, AvatarFallback } from '../ui/avatar'
import ContentProperties from './ContentProperties'
import type { Content } from '../../types'
import { isTextContent, isRectangleContent, isCircleContent, isGroupContent } from '../../types'
import { getTextExcerpt } from '../../lib/utils'
import { Lock, Copy, Trash2, Folder, ChevronRight, ChevronDown } from 'lucide-react'
import { useCanEdit } from '../../contexts/CanvasContext'

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
  onCopyContent?: (content: Content) => void
  onDeleteContent?: (id: string) => void
  onBringToFront?: (id: string) => void
  onSendToBack?: (id: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
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
  onCopyContent,
  onDeleteContent,
  onBringToFront,
  onSendToBack,
  onMoveUp,
  onMoveDown,
}) => {
  const selectedItemRef = useRef<HTMLDivElement>(null)
  const selectedNestedItemRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [expandedItemId, setExpandedItemId] = React.useState<string | null>(null)
  const [selectedNestedItemId, setSelectedNestedItemId] = React.useState<string | null>(null)
  const [groupNestedExpanded, setGroupNestedExpanded] = React.useState<boolean>(false)
  const canEdit = useCanEdit()

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

  // Helper to generate a descriptive label for content
  const getContentLabel = (shape: Content): string => {
    // For text, show excerpt
    if (isTextContent(shape)) {
      return getTextExcerpt(shape.text, 20) || 'Text'
    }

    // Safety check - ensure ID exists
    if (!shape.id) {
      return shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
    }

    // For all other types (including groups), extract a short identifier from the ID
    // ID format: {type}-{timestamp}-{random}
    const idParts = shape.id.split('-')
    if (idParts.length >= 2) {
      const type = idParts[0].charAt(0).toUpperCase() + idParts[0].slice(1)
      const shortId = idParts[idParts.length - 1].slice(0, 4) // Last 4 chars of random suffix

      // For groups, also show item count
      if (isGroupContent(shape)) {
        return `${type} ${shortId} (${shape.contentIds.length} items)`
      }

      return `${type} ${shortId}`
    }

    // Fallback to just the type
    return shape.type.charAt(0).toUpperCase() + shape.type.slice(1)
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
    if (isGroupContent(shape)) {
      return <Folder className={`${iconSize} text-purple-600`} />
    }
    return null
  }

  // Handle nested item click - select the nested item for editing
  const handleNestedItemClick = (groupId: string, nestedItemId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedNestedItemId(nestedItemId)
    // Keep the group expanded
    setExpandedItemId(groupId)
  }

  // Render nested items within a group
  const renderNestedItems = (groupId: string, groupContent: Content) => {
    if (!isGroupContent(groupContent)) return null

    // Reverse contentIds so top layer (last in array) appears first in list
    const reversedContentIds = [...groupContent.contentIds].reverse()

    // Helper functions for nested item z-index operations
    const bringNestedToFront = (nestedId: string) => {
      const newContentIds = groupContent.contentIds.filter(id => id !== nestedId)
      newContentIds.push(nestedId)
      onUpdateShape(groupId, { contentIds: newContentIds })
    }

    const sendNestedToBack = (nestedId: string) => {
      const newContentIds = groupContent.contentIds.filter(id => id !== nestedId)
      newContentIds.unshift(nestedId)
      onUpdateShape(groupId, { contentIds: newContentIds })
    }

    const moveNestedUp = (nestedId: string) => {
      const index = groupContent.contentIds.indexOf(nestedId)
      if (index === -1 || index === groupContent.contentIds.length - 1) return
      const newContentIds = [...groupContent.contentIds]
      ;[newContentIds[index], newContentIds[index + 1]] = [newContentIds[index + 1], newContentIds[index]]
      onUpdateShape(groupId, { contentIds: newContentIds })
    }

    const moveNestedDown = (nestedId: string) => {
      const index = groupContent.contentIds.indexOf(nestedId)
      if (index === -1 || index === 0) return
      const newContentIds = [...groupContent.contentIds]
      ;[newContentIds[index], newContentIds[index - 1]] = [newContentIds[index - 1], newContentIds[index]]
      onUpdateShape(groupId, { contentIds: newContentIds })
    }

    return reversedContentIds.map((nestedItemId) => {
      const nestedItem = groupContent.contentData[nestedItemId]
      if (!nestedItem) return null

      const label = getContentLabel(nestedItem)

      const isNestedItemSelected = selectedNestedItemId === nestedItemId

      return (
        <div
          key={nestedItemId}
          ref={isNestedItemSelected ? selectedNestedItemRef : null}
          className="hover:bg-gray-100 border-l-2 border-gray-300"
        >
          <div
            className={`rounded cursor-pointer transition-colors ${
              isNestedItemSelected ? 'bg-blue-50 border border-blue-200 p-2' : 'p-2'
            }`}
            onClick={(e) => handleNestedItemClick(groupId, nestedItemId, e)}
          >
            <div className="flex items-center gap-2 min-w-0 pl-4">
              <div className="flex-shrink-0">
                {renderShapeIcon(nestedItem)}
              </div>
              <span className="text-xs font-medium text-gray-700 truncate">{label}</span>
            </div>

            {/* Show properties for selected nested item */}
            {isNestedItemSelected && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <ContentProperties
                  content={nestedItem}
                  onUpdate={(updates) => {
                    // Update the nested item within the group
                    if (isGroupContent(groupContent)) {
                      const updatedContentData: typeof groupContent.contentData = {
                        ...groupContent.contentData,
                        [nestedItemId]: {
                          ...nestedItem,
                          ...updates
                        } as any
                      }
                      onUpdateShape(groupId, {
                        contentData: updatedContentData
                      })
                    }
                  }}
                  readOnly={!canEdit}
                  onBringToFront={() => bringNestedToFront(nestedItemId)}
                  onSendToBack={() => sendNestedToBack(nestedItemId)}
                  onMoveUp={() => moveNestedUp(nestedItemId)}
                  onMoveDown={() => moveNestedDown(nestedItemId)}
                />
              </div>
            )}
          </div>
        </div>
      )
    })
  }

  // Scroll to selected item and auto-expand when selection changes
  useEffect(() => {
    if (selectedShape) {
      // Auto-expand the selected item
      setExpandedItemId(selectedShape.id)
    }
  }, [selectedShape?.id])

  // Scroll to show full expanded content in view (for top-level items)
  useEffect(() => {
    if (selectedShape && expandedItemId === selectedShape.id && selectedItemRef.current && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has rendered the expanded content
      requestAnimationFrame(() => {
        selectedItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      })
    }
  }, [expandedItemId, selectedShape?.id, content]) // Added content dependency for reordering

  // Scroll to show nested item in view when selected or reordered
  useEffect(() => {
    if (selectedNestedItemId && selectedNestedItemRef.current && scrollContainerRef.current) {
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        selectedNestedItemRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        })
      })
    }
  }, [selectedNestedItemId, content]) // Added content dependency for reordering

  if (!isVisible) {
    return null
  }

  // Reverse content order so top layer (last in contentIds) appears first in list
  // The content prop is already ordered by z-index (first = bottom, last = top)
  // We reverse it so the UI shows top layer at the top of the list
  const sortedContent = [...content].reverse();

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
            const label = getContentLabel(shape)

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
                  {!canEdit ? (
                    // View-only mode: show lock for all items
                    <div className="flex-shrink-0 text-gray-500" title="View only - no edit permission">
                      <Lock className="h-3.5 w-3.5" />
                    </div>
                  ) : isLockedBySelf ? (
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

                {/* Content properties - show if expanded and not locked by someone else */}
                {!isLockedByOther && isExpanded && (
                  <div className="px-2 pb-2 pt-2 border-t border-gray-200">
                    <ContentProperties
                      content={shape}
                      onUpdate={(updates) => onUpdateShape(shape.id, updates)}
                      readOnly={!canEdit}
                      onBringToFront={onBringToFront}
                      onSendToBack={onSendToBack}
                      onMoveUp={onMoveUp}
                      onMoveDown={onMoveDown}
                    />
                  </div>
                )}

                {/* Nested items - show if expanded and is a group */}
                {isExpanded && isGroupContent(shape) && (
                  <div className="border-t border-gray-200">
                    {/* Collapsible header for nested items */}
                    <div
                      className="px-2 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                      onClick={() => setGroupNestedExpanded(!groupNestedExpanded)}
                    >
                      <div className="flex items-center gap-2">
                        {groupNestedExpanded ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-xs font-medium text-gray-700">
                          Nested Content ({shape.contentIds.length} items)
                        </span>
                      </div>
                    </div>

                    {/* Nested items list - only show when expanded */}
                    {groupNestedExpanded && (
                      <div className="border-t border-gray-200">
                        {renderNestedItems(shape.id, shape)}
                      </div>
                    )}
                  </div>
                )}

                {/* Action buttons - shown at bottom of properties when expanded */}
                {canEdit && !isLockedByOther && isExpanded && (
                  <div className="px-2 pb-2 pt-2 border-t border-gray-200 space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCopyContent?.(shape)}
                      className="w-full h-8 flex items-center justify-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      title="Duplicate content"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteContent?.(shape.id)}
                      className="w-full h-8 flex items-center justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      title="Delete content"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete</span>
                    </Button>
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
