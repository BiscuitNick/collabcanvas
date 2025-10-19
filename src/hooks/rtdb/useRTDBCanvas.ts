/**
 * Main RTDB integration hook for collaborative canvas
 *
 * This hook combines all RTDB features:
 * - Real-time presence and cursors
 * - Real-time content sync (during active editing)
 * - Object locking to prevent conflicts
 * - Firestore persistence (debounced after changes complete)
 *
 * Usage:
 * const { presence, cursors, updateContent, flushToFirestore } = useRTDBCanvas(canvasId)
 */

import { useCallback } from 'react'
import { useRTDBPresence } from './useRTDBPresence'
import { useRTDBCursors } from './useRTDBCursors'
import { useRTDBLocking } from './useRTDBLocking'
import { useRTDBContentSync } from './useRTDBContentSync'
import type { Content } from '../../types'

interface RTDBCanvasOptions {
  /** Enable Firestore persistence (default: true) */
  enableFirestorePersistence?: boolean
  /** Callback when lock is acquired */
  onLockAcquired?: (itemId: string) => void
  /** Callback when lock is released */
  onLockReleased?: (itemId: string) => void
  /** Callback when lock fails */
  onLockFailed?: (itemId: string) => void
  /** Callback when Firestore is updated */
  onFirestoreUpdate?: (content: Content) => void
}

export const useRTDBCanvas = (
  canvasId: string | null,
  options: RTDBCanvasOptions = {}
) => {
  const {
    enableFirestorePersistence = true,
    onLockAcquired,
    onLockReleased,
    onLockFailed,
    onFirestoreUpdate,
  } = options

  // Presence and cursors
  const { activeUsers } = useRTDBPresence(canvasId)
  const { cursors, updateCursor, removeCursor } = useRTDBCursors(canvasId)

  // Object locking
  const {
    acquireLock,
    releaseLock,
    isLocked,
    isLockedByCurrentUser,
    watchLock,
    releaseAllLocks,
  } = useRTDBLocking(canvasId, {
    onLockAcquired,
    onLockReleased,
    onLockFailed: onLockFailed
      ? (itemId) => onLockFailed(itemId)
      : undefined,
  })

  // Content sync
  const {
    updateContentRTDB,
    updateContentIdsRTDB,
    removeContentRTDB,
    flushFirestoreUpdate,
  } = useRTDBContentSync(canvasId, {
    enableFirestorePersistence,
    onFirestoreUpdate,
  })

  /**
   * Start editing an object
   * - Acquires lock
   * - Returns true if lock was acquired, false otherwise
   */
  const startEditing = useCallback(
    async (itemId: string): Promise<boolean> => {
      const lockAcquired = await acquireLock(itemId)
      return lockAcquired
    },
    [acquireLock]
  )

  /**
   * Stop editing an object
   * - Releases lock
   * - Flushes pending changes to Firestore
   */
  const stopEditing = useCallback(
    async (itemId: string): Promise<void> => {
      await releaseLock(itemId)
      await flushFirestoreUpdate(itemId)
    },
    [releaseLock, flushFirestoreUpdate]
  )

  /**
   * Update content during active editing (throttled, RTDB only)
   */
  const updateContentWhileEditing = useCallback(
    (itemId: string, updates: Partial<Content>) => {
      updateContentRTDB(itemId, updates, false)
    },
    [updateContentRTDB]
  )

  /**
   * Update content after editing completes (immediate, RTDB + Firestore)
   */
  const updateContentAfterEditing = useCallback(
    (itemId: string, updates: Partial<Content>) => {
      updateContentRTDB(itemId, updates, true)
    },
    [updateContentRTDB]
  )

  /**
   * Update content z-index order
   */
  const updateContentIds = useCallback(
    (contentIds: string[]) => {
      updateContentIdsRTDB(contentIds)
    },
    [updateContentIdsRTDB]
  )

  /**
   * Remove content from RTDB
   */
  const removeContent = useCallback(
    (itemId: string) => {
      removeContentRTDB(itemId)
    },
    [removeContentRTDB]
  )

  /**
   * Flush all pending Firestore updates immediately
   */
  const flushAllToFirestore = useCallback(
    async (itemIds: string[]) => {
      await Promise.all(itemIds.map((id) => flushFirestoreUpdate(id)))
    },
    [flushFirestoreUpdate]
  )

  return {
    // Presence
    activeUsers,

    // Cursors
    cursors,
    updateCursor,
    removeCursor,

    // Locking
    isLocked,
    isLockedByCurrentUser,
    watchLock,
    releaseAllLocks,

    // Editing workflow
    startEditing,
    stopEditing,

    // Content updates
    updateContentWhileEditing,
    updateContentAfterEditing,
    updateContentIds,
    removeContent,

    // Firestore persistence
    flushToFirestore: flushFirestoreUpdate,
    flushAllToFirestore,
  }
}
