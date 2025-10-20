import { useEffect, useRef, useCallback } from 'react'
import { ref, set, get, remove, onValue } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, LOCK_HEARTBEAT_INTERVAL, PRESENCE_OFFLINE_THRESHOLD, LOCK_TIMEOUT_MS } from '../../lib/rtdb-config'
import { useAuth } from '../useAuth'

interface LockData {
  userId: string
  userName: string
  color: string
  lockedAt: number
  lastHeartbeat: number
}

interface LockCallbacks {
  onLockAcquired?: (itemId: string) => void
  onLockReleased?: (itemId: string) => void
  onLockFailed?: (itemId: string, currentOwner: LockData) => void
}

// SelectionData interface - for future use when displaying selection indicators
// interface SelectionData {
//   userId: string
//   userName: string
//   selectedAt: number
// }

export const useRTDBLocking = (
  canvasId: string | null,
  callbacks?: LockCallbacks
) => {
  const { user } = useAuth()
  const lockedItemsRef = useRef<Set<string>>(new Set())
  const heartbeatIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())


  /**
   * Attempt to acquire a lock on an item (selection-based lock)
   * Returns true if lock was acquired, false otherwise
   */
  const acquireLock = useCallback(
    async (itemId: string): Promise<boolean> => {
      if (!canvasId || !user) return false

      const paths = getRTDBPaths(canvasId)
      const presenceRef = ref(database, `${paths.presence}/${user.uid}`)

      try {
        // Check if another user has this item locked via presence
        const allPresenceRef = ref(database, paths.presence)
        const presenceSnapshot = await get(allPresenceRef)
        const allPresence = presenceSnapshot.val() as Record<string, {
          userId: string
          userName: string
          lockedItemId: string | null
          lastSeen: number
        }> | null

        const now = Date.now()

        // Check if someone else has this item locked
        if (allPresence) {
          for (const [userId, presence] of Object.entries(allPresence)) {
            if (userId === user.uid) continue  // Skip self
            if (presence.lockedItemId === itemId) {
              // Check if they're still active
              if (now - presence.lastSeen <= PRESENCE_OFFLINE_THRESHOLD) {
                // Item is locked by active user
                return false
              }
            }
          }
        }

        // Acquire lock by updating presence with locked item ID
        await set(presenceRef, {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          photoURL: user.photoURL || null,
          joinedAt: now,
          lastSeen: now,
          lockedItemId: itemId,  // Single source of truth for locked item
        })

        lockedItemsRef.current.add(itemId)

        // Start heartbeat to keep presence alive (which keeps lock alive)
        const heartbeatInterval = setInterval(async () => {
          try {
            const presenceUpdateRef = ref(database, `${paths.presence}/${user.uid}/lastSeen`)
            await set(presenceUpdateRef, Date.now())
          } catch (error) {
          }
        }, LOCK_HEARTBEAT_INTERVAL)

        heartbeatIntervalsRef.current.set(itemId, heartbeatInterval)

        callbacks?.onLockAcquired?.(itemId)
        return true
      } catch (error) {
        return false
      }
    },
    [canvasId, user, callbacks]
  )

  /**
   * Release a lock on an item
   */
  const releaseLock = useCallback(
    async (itemId: string): Promise<void> => {
      if (!canvasId || !user) return

      const paths = getRTDBPaths(canvasId)

      try {
        // Clear locked item from presence
        const presenceRef = ref(database, `${paths.presence}/${user.uid}/lockedItemId`)
        await remove(presenceRef)

        lockedItemsRef.current.delete(itemId)

        // Clear heartbeat interval
        const heartbeatInterval = heartbeatIntervalsRef.current.get(itemId)
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatIntervalsRef.current.delete(itemId)
        }

        callbacks?.onLockReleased?.(itemId)
      } catch (error) {
      }
    },
    [canvasId, user, callbacks]
  )

  /**
   * Check if an item is locked
   */
  const isLocked = useCallback(
    async (itemId: string): Promise<{ locked: boolean; lockData?: LockData }> => {
      if (!canvasId) return { locked: false }

      const paths = getRTDBPaths(canvasId)
      const lockRef = ref(database, paths.itemLock(itemId))

      try {
        const lockSnapshot = await get(lockRef)
        const lockData = lockSnapshot.val() as LockData | null

        if (!lockData) return { locked: false }

        const now = Date.now()
        const isStale = now - lockData.lastHeartbeat > LOCK_TIMEOUT_MS

        if (isStale) {
          // Remove stale lock
          await remove(lockRef)
          return { locked: false }
        }

        return { locked: true, lockData }
      } catch (error) {
        return { locked: false }
      }
    },
    [canvasId]
  )

  /**
   * Check if current user owns a lock
   */
  const isLockedByCurrentUser = useCallback(
    (itemId: string): boolean => {
      return lockedItemsRef.current.has(itemId)
    },
    []
  )

  /**
   * Listen for lock changes on an item
   */
  const watchLock = useCallback(
    (itemId: string, onLockChange: (lockData: LockData | null) => void) => {
      if (!canvasId) return () => {}

      const paths = getRTDBPaths(canvasId)
      const lockRef = ref(database, paths.itemLock(itemId))

      const unsubscribe = onValue(lockRef, (snapshot) => {
        const lockData = snapshot.val() as LockData | null

        if (lockData) {
          const now = Date.now()
          const isStale = now - lockData.lastHeartbeat > LOCK_TIMEOUT_MS

          if (isStale) {
            // Remove stale lock
            remove(lockRef)
            onLockChange(null)
          } else {
            onLockChange(lockData)
          }
        } else {
          onLockChange(null)
        }
      })

      return unsubscribe
    },
    [canvasId]
  )

  /**
   * Release all locks held by current user
   * Since we now use presence for locks, we just clear the lockedItemId from presence
   */
  const releaseAllLocks = useCallback(async () => {
    if (!canvasId || !user) return

    const paths = getRTDBPaths(canvasId)

    try {
      // Clear locked item from presence (single source of truth)
      const presenceRef = ref(database, `${paths.presence}/${user.uid}/lockedItemId`)
      await remove(presenceRef)

      // Clear local tracking
      lockedItemsRef.current.clear()
      heartbeatIntervalsRef.current.forEach(interval => clearInterval(interval))
      heartbeatIntervalsRef.current.clear()
    } catch (error) {
    }
  }, [canvasId, user])

  /**
   * Track selection in RTDB (selection acquires lock, deselection releases it)
   */
  const setSelection = useCallback(
    async (itemId: string | null): Promise<void> => {
      if (!canvasId || !user) return

      const paths = getRTDBPaths(canvasId)
      const selectionsRef = ref(database, `${paths.presence}/${user.uid}/selection`)

      try {
        // First, release any existing locks
        await releaseAllLocks()

        if (itemId) {
          // Set selection
          await set(selectionsRef, itemId)

          // Acquire lock for selected item
          const lockAcquired = await acquireLock(itemId)
          if (lockAcquired) {
          }
        } else {
          // Clear selection
          await remove(selectionsRef)
        }
      } catch (error) {
      }
    },
    [canvasId, user, acquireLock, releaseAllLocks]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      releaseAllLocks()
    }
  }, [releaseAllLocks])

  return {
    acquireLock,
    releaseLock,
    isLocked,
    isLockedByCurrentUser,
    watchLock,
    releaseAllLocks,
    setSelection,
  }
}
