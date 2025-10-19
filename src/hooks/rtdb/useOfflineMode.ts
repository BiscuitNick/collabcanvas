/**
 * Offline mode handler for RTDB
 *
 * When RTDB is offline:
 * - Queues changes locally
 * - Allows local-only edits
 * - Syncs to Firestore when connection is restored
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../lib/firebase'
import { useContentOperations } from '../firestore/useContentOperations'
import type { Content } from '../../types'

interface QueuedUpdate {
  itemId: string
  updates: Partial<Content>
  timestamp: number
}

interface OfflineModeOptions {
  /** Maximum number of queued updates (default: 1000) */
  maxQueueSize?: number
  /** Callback when connection status changes */
  onConnectionChange?: (isOnline: boolean) => void
  /** Callback when queued updates are synced */
  onQueueSynced?: (count: number) => void
}

export const useOfflineMode = (
  _canvasId: string | null,
  options: OfflineModeOptions = {}
) => {
  const { maxQueueSize = 1000, onConnectionChange, onQueueSynced } = options

  const [isOnline, setIsOnline] = useState(true)
  const [queuedUpdates, setQueuedUpdates] = useState<QueuedUpdate[]>([])
  const isSyncingRef = useRef(false)

  const { updateContent: updateContentInFirestore } = useContentOperations(
    [],
    () => {},
    { current: new Set() },
    { current: false },
    undefined,
    async () => {},
    async () => {}
  )

  /**
   * Add update to offline queue
   */
  const queueUpdate = useCallback(
    (itemId: string, updates: Partial<Content>) => {
      setQueuedUpdates((prev) => {
        // Check if we've hit the queue size limit
        if (prev.length >= maxQueueSize) {
          console.warn(
            `Offline queue is full (${maxQueueSize} items). Dropping oldest update.`
          )
          // Drop the oldest update
          prev = prev.slice(1)
        }

        // Check if there's already a queued update for this item
        const existingIndex = prev.findIndex((qu) => qu.itemId === itemId)

        if (existingIndex !== -1) {
          // Merge with existing queued update
          const updated = [...prev]
          updated[existingIndex] = {
            itemId,
            updates: {
              ...updated[existingIndex].updates,
              ...updates,
            },
            timestamp: Date.now(),
          }
          return updated
        } else {
          // Add new queued update
          return [
            ...prev,
            {
              itemId,
              updates,
              timestamp: Date.now(),
            },
          ]
        }
      })
    },
    [maxQueueSize]
  )

  /**
   * Sync queued updates to Firestore
   */
  const syncQueuedUpdates = useCallback(async () => {
    if (isSyncingRef.current || queuedUpdates.length === 0) return

    isSyncingRef.current = true

    try {
      console.log(`Syncing ${queuedUpdates.length} queued updates to Firestore...`)

      // Sort by timestamp (oldest first)
      const sorted = [...queuedUpdates].sort((a, b) => a.timestamp - b.timestamp)

      // Sync each update
      for (const { itemId, updates } of sorted) {
        try {
          await updateContentInFirestore(itemId, updates)
        } catch (error) {
          console.error(`Error syncing update for ${itemId}:`, error)
        }
      }

      // Clear queue
      setQueuedUpdates([])
      onQueueSynced?.(sorted.length)

      console.log('Queue synced successfully')
    } catch (error) {
      console.error('Error syncing queued updates:', error)
    } finally {
      isSyncingRef.current = false
    }
  }, [queuedUpdates, updateContentInFirestore, onQueueSynced])

  /**
   * Clear all queued updates
   */
  const clearQueue = useCallback(() => {
    setQueuedUpdates([])
  }, [])

  /**
   * Monitor RTDB connection status
   */
  useEffect(() => {
    // Use Firebase's special .info/connected endpoint to track connection status
    const connectedRef = ref(database, '.info/connected')

    const unsubscribe = onValue(connectedRef, (snapshot) => {
      const connected = snapshot.val() as boolean

      setIsOnline(connected)
      onConnectionChange?.(connected)

      if (connected) {
        console.log('RTDB connection established')
        // Sync queued updates when connection is restored
        syncQueuedUpdates()
      } else {
        console.log('RTDB connection lost - entering offline mode')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [onConnectionChange, syncQueuedUpdates])

  return {
    isOnline,
    queuedUpdates,
    queuedUpdateCount: queuedUpdates.length,
    queueUpdate,
    syncQueuedUpdates,
    clearQueue,
  }
}
