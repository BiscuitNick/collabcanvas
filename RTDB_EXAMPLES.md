# RTDB Integration Examples

This document provides complete examples of how to integrate RTDB into various components.

## Example 1: Enhanced CanvasPage with RTDB

```tsx
import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Navigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'
import { useCanvasStore } from '../store/canvasStore'
import { useCanvasMetadata } from '../hooks/useCanvasMetadata'
import { CanvasProvider, useCanEdit } from '../contexts/CanvasContext'
import FullScreenLayout from '../components/layout/FullScreenLayout'
import Canvas from '../components/canvas/Canvas'
import ErrorBoundary from '../components/ErrorBoundary'

const CanvasPageContent: React.FC = () => {
  const [searchParams] = useSearchParams()
  const canvasId = searchParams.get('id')!
  const { user } = useAuth()
  const canEdit = useCanEdit()
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Use RTDB-enhanced content hook
  const {
    content,
    updateContent,           // For real-time updates during editing
    updateContentComplete,   // For immediate Firestore sync after editing
    startEditing,            // Acquire lock before editing
    stopEditing,             // Release lock and flush to Firestore
    activeUsers,             // Real-time presence
    cursors,                 // Real-time cursors
    updateCursor,            // Update current user's cursor
    isOnline,                // RTDB connection status
    queuedUpdateCount,       // Number of offline queued updates
  } = useContentWithRTDB()

  const { stagePosition, stageScale } = useCanvasStore()

  // Handle cursor movement
  const handleMouseMove = useCallback((x: number, y: number) => {
    updateCursor(x, y)
  }, [updateCursor])

  // Handle drag with RTDB
  const handleDragMove = useCallback((id: string, x: number, y: number) => {
    // Real-time update via RTDB (throttled to ~60fps)
    updateContent(id, { x, y })
  }, [updateContent])

  const handleDragEnd = useCallback(async (id: string, x: number, y: number) => {
    // Immediate Firestore sync
    updateContentComplete(id, { x, y })
    await stopEditing(id)
  }, [updateContentComplete, stopEditing])

  const handleDragStart = useCallback(async (id: string) => {
    // Acquire lock before dragging
    const lockAcquired = await startEditing(id)
    if (!lockAcquired) {
      alert('This object is being edited by another user')
      // Prevent drag
      return false
    }
    return true
  }, [startEditing])

  // Calculate canvas size
  useEffect(() => {
    const updateCanvasSize = () => {
      const leftColumnWidth = 320
      const pagePadding = 40
      const availableWidth = window.innerWidth - leftColumnWidth - pagePadding
      const availableHeight = window.innerHeight - pagePadding

      setCanvasSize({
        width: Math.max(400, availableWidth),
        height: Math.max(300, availableHeight)
      })
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return (
    <ErrorBoundary>
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded shadow-lg z-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
            <span>Offline - {queuedUpdateCount} changes pending</span>
          </div>
        </div>
      )}

      <FullScreenLayout
        content={content}
        cursors={Array.from(cursors.values())}
        presence={activeUsers}
        currentUserId={user?.uid}
        onMouseMove={handleMouseMove}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        canEdit={canEdit}
      />
    </ErrorBoundary>
  )
}
```

## Example 2: Text Input with Locking

```tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'

interface TextEditorProps {
  contentId: string
  initialText: string
}

export const TextEditor: React.FC<TextEditorProps> = ({ contentId, initialText }) => {
  const [text, setText] = useState(initialText)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedBy, setLockedBy] = useState<string | null>(null)

  const {
    updateContent,
    updateContentComplete,
    startEditing,
    stopEditing,
    isLocked: checkLock,
  } = useContentWithRTDB()

  // Check lock status
  useEffect(() => {
    const checkLockStatus = async () => {
      const { locked, lockData } = await checkLock(contentId)
      setIsLocked(locked)
      setLockedBy(lockData?.userName || null)
    }

    checkLockStatus()
    const interval = setInterval(checkLockStatus, 5000)
    return () => clearInterval(interval)
  }, [contentId, checkLock])

  // Acquire lock on focus
  const handleFocus = useCallback(async () => {
    const lockAcquired = await startEditing(contentId)

    if (!lockAcquired) {
      alert(`This text is being edited by ${lockedBy || 'another user'}`)
      // Blur the input
      const input = document.getElementById(contentId) as HTMLInputElement
      input?.blur()
    }
  }, [contentId, startEditing, lockedBy])

  // Update in real-time while typing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value
    setText(newText)

    // Real-time update via RTDB
    updateContent(contentId, { text: newText })
  }, [contentId, updateContent])

  // Release lock and flush to Firestore on blur
  const handleBlur = useCallback(async () => {
    // Immediate Firestore sync
    updateContentComplete(contentId, { text })
    await stopEditing(contentId)
  }, [contentId, text, updateContentComplete, stopEditing])

  return (
    <div className="relative">
      <input
        id={contentId}
        type="text"
        value={text}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={isLocked && !lockedBy} // Disable if locked by someone else
        className={`
          w-full px-4 py-2 border rounded
          ${isLocked ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}
        `}
      />

      {isLocked && lockedBy && (
        <div className="absolute -top-6 left-0 text-xs text-yellow-700">
          Being edited by {lockedBy}
        </div>
      )}
    </div>
  )
}
```

## Example 3: Properties Panel with RTDB

```tsx
import React, { useState, useCallback, useEffect } from 'react'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'
import type { Content } from '../types'

interface PropertiesPanelProps {
  selectedContent: Content | null
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedContent }) => {
  const [localProps, setLocalProps] = useState<Partial<Content>>({})
  const [isEditing, setIsEditing] = useState(false)

  const {
    updateContent,
    updateContentComplete,
    startEditing,
    stopEditing,
  } = useContentWithRTDB()

  // Sync local props with selected content
  useEffect(() => {
    if (selectedContent) {
      setLocalProps({
        x: selectedContent.x,
        y: selectedContent.y,
        rotation: selectedContent.rotation || 0,
        opacity: selectedContent.opacity || 1,
      })
    }
  }, [selectedContent])

  // Start editing when panel is opened
  useEffect(() => {
    if (selectedContent && !isEditing) {
      const acquireLock = async () => {
        const locked = await startEditing(selectedContent.id)
        setIsEditing(locked)
      }
      acquireLock()
    }

    return () => {
      if (selectedContent && isEditing) {
        stopEditing(selectedContent.id)
        setIsEditing(false)
      }
    }
  }, [selectedContent?.id])

  // Update property with real-time sync
  const handlePropertyChange = useCallback((property: string, value: number) => {
    if (!selectedContent) return

    const updates = { [property]: value }
    setLocalProps(prev => ({ ...prev, ...updates }))

    // Real-time update via RTDB
    updateContent(selectedContent.id, updates)
  }, [selectedContent, updateContent])

  // Flush to Firestore on input blur
  const handleInputBlur = useCallback((property: string, value: number) => {
    if (!selectedContent) return

    const updates = { [property]: value }

    // Immediate Firestore sync
    updateContentComplete(selectedContent.id, updates)
  }, [selectedContent, updateContentComplete])

  if (!selectedContent) {
    return <div className="p-4 text-gray-500">No content selected</div>
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold mb-4">Properties</h3>

      {/* Position X */}
      <div>
        <label className="block text-sm font-medium mb-1">X Position</label>
        <input
          type="number"
          value={localProps.x || 0}
          onChange={(e) => handlePropertyChange('x', parseFloat(e.target.value))}
          onBlur={(e) => handleInputBlur('x', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          disabled={!isEditing}
        />
      </div>

      {/* Position Y */}
      <div>
        <label className="block text-sm font-medium mb-1">Y Position</label>
        <input
          type="number"
          value={localProps.y || 0}
          onChange={(e) => handlePropertyChange('y', parseFloat(e.target.value))}
          onBlur={(e) => handleInputBlur('y', parseFloat(e.target.value))}
          className="w-full px-3 py-2 border rounded"
          disabled={!isEditing}
        />
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-sm font-medium mb-1">Rotation</label>
        <input
          type="range"
          min="0"
          max="360"
          value={localProps.rotation || 0}
          onChange={(e) => handlePropertyChange('rotation', parseFloat(e.target.value))}
          onMouseUp={(e) => handleInputBlur('rotation', parseFloat((e.target as HTMLInputElement).value))}
          className="w-full"
          disabled={!isEditing}
        />
        <span className="text-sm text-gray-600">{localProps.rotation || 0}°</span>
      </div>

      {/* Opacity */}
      <div>
        <label className="block text-sm font-medium mb-1">Opacity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localProps.opacity || 1}
          onChange={(e) => handlePropertyChange('opacity', parseFloat(e.target.value))}
          onMouseUp={(e) => handleInputBlur('opacity', parseFloat((e.target as HTMLInputElement).value))}
          className="w-full"
          disabled={!isEditing}
        />
        <span className="text-sm text-gray-600">{Math.round((localProps.opacity || 1) * 100)}%</span>
      </div>

      {!isEditing && (
        <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
          This content is locked by another user
        </div>
      )}
    </div>
  )
}
```

## Example 4: Presence Avatars

```tsx
import React from 'react'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'

export const PresenceAvatars: React.FC = () => {
  const { activeUsers, isOnline } = useContentWithRTDB()

  return (
    <div className="flex items-center gap-2 p-4">
      {/* Connection status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Active users */}
      <div className="flex items-center gap-1 ml-4">
        {activeUsers.map((user) => (
          <div
            key={user.uid}
            className="relative group"
            title={user.displayName}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-8 h-8 rounded-full border-2"
                style={{ borderColor: user.color }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-white text-sm font-medium"
                style={{
                  borderColor: user.color,
                  backgroundColor: user.color
                }}
              >
                {user.displayName?.charAt(0).toUpperCase()}
              </div>
            )}

            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {user.displayName}
            </div>
          </div>
        ))}

        {activeUsers.length === 0 && (
          <span className="text-sm text-gray-500">No other users</span>
        )}
      </div>
    </div>
  )
}
```

## Example 5: Custom Shape with RTDB

```tsx
import React, { useCallback, useState } from 'react'
import { Rect, Transformer } from 'react-konva'
import Konva from 'konva'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'
import type { RectangleContent } from '../types'

interface RectangleProps {
  shape: RectangleContent
  isSelected: boolean
  onSelect: () => void
}

export const Rectangle: React.FC<RectangleProps> = ({ shape, isSelected, onSelect }) => {
  const shapeRef = React.useRef<Konva.Rect>(null)
  const transformerRef = React.useRef<Konva.Transformer>(null)
  const [isLocked, setIsLocked] = useState(false)

  const {
    updateContent,
    updateContentComplete,
    startEditing,
    stopEditing,
    isLockedByCurrentUser,
  } = useContentWithRTDB()

  // Attach transformer when selected
  React.useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  // Handle drag start - acquire lock
  const handleDragStart = useCallback(async () => {
    const lockAcquired = await startEditing(shape.id)
    setIsLocked(!lockAcquired)

    if (!lockAcquired) {
      // Prevent drag
      shapeRef.current?.stopDrag()
      alert('This shape is being edited by another user')
    }
  }, [shape.id, startEditing])

  // Handle drag move - real-time update
  const handleDragMove = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const { x, y } = node.position()

    // Real-time update via RTDB
    updateContent(shape.id, { x, y })
  }, [shape.id, updateContent])

  // Handle drag end - flush to Firestore
  const handleDragEnd = useCallback(async (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const { x, y } = node.position()

    // Immediate Firestore sync
    updateContentComplete(shape.id, { x, y })
    await stopEditing(shape.id)
  }, [shape.id, updateContentComplete, stopEditing])

  // Handle transform - real-time update
  const handleTransform = useCallback(() => {
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Real-time update via RTDB
    updateContent(shape.id, {
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      rotation: node.rotation(),
    })

    // Reset scale
    node.scaleX(1)
    node.scaleY(1)
  }, [shape.id, updateContent])

  // Handle transform end - flush to Firestore
  const handleTransformEnd = useCallback(async () => {
    const node = shapeRef.current
    if (!node) return

    const updates = {
      width: node.width(),
      height: node.height(),
      rotation: node.rotation(),
    }

    // Immediate Firestore sync
    updateContentComplete(shape.id, updates)
    await stopEditing(shape.id)
  }, [shape.id, updateContentComplete, stopEditing])

  return (
    <>
      <Rect
        ref={shapeRef}
        {...shape}
        draggable={!isLocked}
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onTransform={handleTransform}
        onTransformEnd={handleTransformEnd}
        opacity={isLocked ? 0.5 : shape.opacity || 1}
        stroke={isLocked ? '#ef4444' : undefined}
        strokeWidth={isLocked ? 2 : 0}
      />

      {isSelected && !isLocked && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox
            }
            return newBox
          }}
        />
      )}
    </>
  )
}
```

## Example 6: Offline Queue Manager

```tsx
import React from 'react'
import { useContentWithRTDB } from '../hooks/useContentWithRTDB'

export const OfflineQueueManager: React.FC = () => {
  const {
    isOnline,
    queuedUpdateCount,
    syncQueuedUpdates,
  } = useContentWithRTDB()

  if (isOnline && queuedUpdateCount === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <div className={`w-3 h-3 rounded-full mt-1 ${isOnline ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />

        <div className="flex-1">
          <h4 className="font-medium text-gray-900">
            {isOnline ? 'Syncing...' : 'Offline Mode'}
          </h4>

          <p className="text-sm text-gray-600 mt-1">
            {queuedUpdateCount} {queuedUpdateCount === 1 ? 'change' : 'changes'} pending
          </p>

          {!isOnline && (
            <p className="text-xs text-gray-500 mt-2">
              Your changes will sync automatically when you're back online
            </p>
          )}

          {isOnline && queuedUpdateCount > 0 && (
            <button
              onClick={syncQueuedUpdates}
              className="mt-3 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
            >
              Sync Now
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

## Integration Checklist

- [ ] Replace `useContent` with `useContentWithRTDB`
- [ ] Add lock acquisition in `onDragStart`
- [ ] Use `updateContent` in `onDragMove` (real-time)
- [ ] Use `updateContentComplete` in `onDragEnd` (immediate Firestore)
- [ ] Add lock acquisition in input `onFocus`
- [ ] Use `updateContent` in input `onChange` (real-time)
- [ ] Use `updateContentComplete` in input `onBlur` (immediate Firestore)
- [ ] Release locks in cleanup/unmount
- [ ] Add offline indicator UI
- [ ] Add presence avatars UI
- [ ] Update cursor rendering with RTDB cursors
- [ ] Test lock conflicts with multiple users
- [ ] Test offline mode queue sync
- [ ] Verify Firestore updates after debounce
- [ ] Add RTDB security rules
