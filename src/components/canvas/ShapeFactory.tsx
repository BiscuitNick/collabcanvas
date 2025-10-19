import React from 'react'
import Rectangle from './Rectangle'
import Circle from './Circle'
import TextContent from './TextContent'
import Image from './Image'
import GroupContent from './GroupContent'
import type { Shape, Rectangle as RectangleType, Circle as CircleType, TextContent as TextContentType, ImageContent as ImageContentType, GroupContent as GroupContentType } from '../../types'
import { isRectangle, isCircle, isTextContent, isImageContent, isGroupContent } from '../../types'

interface LockInfo {
  userId: string
  userName: string
  lockedItemId: string | null
}

interface ShapeFactoryProps {
  shape: Shape
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<Shape>) => void
  onDragMove?: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onDragStart: () => void
  onDragEndCallback: () => void
  currentUserId?: string
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | 'agent' | 'grid' | null
  canEdit?: boolean
  enableGroupCaching?: boolean
  lockInfo?: LockInfo | null
}

/**
 * ShapeFactory component dynamically renders the appropriate shape component
 * based on the shape type. This provides a unified interface for rendering
 * different shape types while maintaining type safety.
 */
const ShapeFactory: React.FC<ShapeFactoryProps> = ({
  shape,
  isSelected,
  onSelect,
  onUpdate,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  currentUserId,
  selectedTool,
  canEdit = true,
  enableGroupCaching = false,
  lockInfo = null,
}) => {
  // Check if locked by another user
  const isLockedByOther = lockInfo !== null && lockInfo.userId !== currentUserId;
  // Handle null or undefined shapes
  if (!shape) {
    console.warn('ShapeFactory received null or undefined shape')
    return null
  }

  // Render Rectangle component
  if (isRectangle(shape)) {
    return (
      <Rectangle
        shape={shape as RectangleType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<RectangleType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
        selectedTool={selectedTool}
        canEdit={canEdit}
        isLockedByOther={isLockedByOther}
        lockInfo={lockInfo}
      />
    )
  }

  // Render Circle component
  if (isCircle(shape)) {
    return (
      <Circle
        shape={shape as CircleType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<CircleType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
        selectedTool={selectedTool}
        canEdit={canEdit}
        isLockedByOther={isLockedByOther}
        lockInfo={lockInfo}
      />
    )
  }

  // Render Text component
  if (isTextContent(shape)) {
    return (
      <TextContent
        content={shape as TextContentType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<TextContentType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
        selectedTool={selectedTool}
        canEdit={canEdit}
        isLockedByOther={isLockedByOther}
        lockInfo={lockInfo}
      />
    )
  }

  // Render Image component
  if (isImageContent(shape)) {
    return (
      <Image
        content={shape as ImageContentType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<ImageContentType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
        selectedTool={selectedTool}
        canEdit={canEdit}
        isLockedByOther={isLockedByOther}
        lockInfo={lockInfo}
      />
    )
  }

  // Render Group component
  if (isGroupContent(shape)) {
    return (
      <GroupContent
        content={shape as GroupContentType}
        isSelected={isSelected}
        onSelect={onSelect}
        onUpdate={onUpdate as (updates: Partial<GroupContentType>) => void}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onDragStart={onDragStart}
        onDragEndCallback={onDragEndCallback}
        currentUserId={currentUserId}
        selectedTool={selectedTool}
        canEdit={canEdit}
        enableGroupCaching={enableGroupCaching}
        isLockedByOther={isLockedByOther}
        lockInfo={lockInfo}
      />
    )
  }

  // Fallback for unknown shape types
  console.warn('Unknown shape type:', shape)
  return null
}

ShapeFactory.displayName = 'ShapeFactory'

export default ShapeFactory
