/**
 * Enhanced useContent hook with RTDB integration
 *
 * This hook extends the original useContent hook with real-time sync:
 * - RTDB for real-time updates during active editing
 * - Object locking to prevent conflicts
 * - Firestore for persistence after edits complete
 * - Offline mode with queue sync
 */

import { useCallback } from 'react'
import { useContent } from './useContent'
import { useRTDBCanvas } from './rtdb/useRTDBCanvas'
import { useOfflineMode } from './rtdb/useOfflineMode'
import { useCanvasId } from '../contexts/CanvasContext'
import type { Content } from '../types'

export const useContentWithRTDB = () => {
  const canvasId = useCanvasId()

  // Get original content hook functionality
  const contentHook = useContent()

  // Get RTDB functionality
  const rtdb = useRTDBCanvas(canvasId, {
    enableFirestorePersistence: true,
    onLockAcquired: (itemId) => {
      console.log(`Lock acquired for ${itemId}`)
    },
    onLockReleased: (itemId) => {
      console.log(`Lock released for ${itemId}`)
    },
    onLockFailed: (itemId) => {
      console.warn(`Failed to acquire lock for ${itemId}`)
    },
    onFirestoreUpdate: (content) => {
      console.log(`Firestore updated for ${content.id}`)
    },
  })

  // Get offline mode functionality
  const offline = useOfflineMode(canvasId, {
    onConnectionChange: (isOnline) => {
      console.log(`RTDB connection ${isOnline ? 'established' : 'lost'}`)
    },
    onQueueSynced: (count) => {
      console.log(`Synced ${count} queued updates to Firestore`)
    },
  })

  /**
   * Update content - uses RTDB for real-time sync
   * This is called during active editing (drag, typing, etc.)
   */
  const updateContentRealtime = useCallback(
    (id: string, updates: Partial<Content>) => {
      if (offline.isOnline) {
        // Online: Update via RTDB (throttled)
        rtdb.updateContentWhileEditing(id, updates)
      } else {
        // Offline: Update locally and queue for Firestore
        contentHook.updateContent(id, updates)
        offline.queueUpdate(id, updates)
      }
    },
    [rtdb, contentHook, offline]
  )

  /**
   * Update content after editing completes
   * This is called on blur, drag end, etc.
   */
  const updateContentComplete = useCallback(
    (id: string, updates: Partial<Content>) => {
      if (offline.isOnline) {
        // Online: Immediately flush to RTDB and Firestore
        rtdb.updateContentAfterEditing(id, updates)
      } else {
        // Offline: Update locally and queue for Firestore
        contentHook.updateContent(id, updates)
        offline.queueUpdate(id, updates)
      }
    },
    [rtdb, contentHook, offline]
  )

  /**
   * Start editing an object
   * Acquires lock and returns true if successful
   */
  const startEditing = useCallback(
    async (id: string): Promise<boolean> => {
      if (!offline.isOnline) {
        // Allow offline editing without lock
        return true
      }

      const lockAcquired = await rtdb.startEditing(id)
      return lockAcquired
    },
    [rtdb, offline]
  )

  /**
   * Stop editing an object
   * Releases lock and flushes to Firestore
   */
  const stopEditing = useCallback(
    async (id: string): Promise<void> => {
      if (!offline.isOnline) {
        // No lock to release offline
        return
      }

      await rtdb.stopEditing(id)
    },
    [rtdb, offline]
  )

  /**
   * Update content z-index order
   */
  const updateContentIds = useCallback(
    (contentIds: string[]) => {
      if (offline.isOnline) {
        rtdb.updateContentIds(contentIds)
      } else {
        // Offline: Update locally only
        // Will sync to Firestore when connection restored
      }
    },
    [rtdb, offline]
  )

  return {
    // Spread original content hook
    ...contentHook,

    // Override with RTDB-enhanced methods
    updateContent: updateContentRealtime,
    updateContentComplete,

    // Add RTDB-specific methods
    startEditing,
    stopEditing,
    updateContentIds,

    // RTDB presence and cursors
    activeUsers: rtdb.activeUsers,
    cursors: rtdb.cursors,
    updateCursor: rtdb.updateCursor,
    removeCursor: rtdb.removeCursor,

    // RTDB locking
    isLocked: rtdb.isLocked,
    isLockedByCurrentUser: rtdb.isLockedByCurrentUser,

    // Offline mode
    isOnline: offline.isOnline,
    queuedUpdateCount: offline.queuedUpdateCount,
    syncQueuedUpdates: offline.syncQueuedUpdates,
  }
}
