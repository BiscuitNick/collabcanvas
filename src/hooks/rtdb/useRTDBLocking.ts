import { useEffect, useRef, useCallback } from 'react'
import { ref, set, get, remove, onValue } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, LOCK_TIMEOUT_MS, LOCK_HEARTBEAT_INTERVAL } from '../../lib/rtdb-config'
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
      const lockRef = ref(database, paths.itemLock(itemId))

      try {
        // Check if lock exists
        const lockSnapshot = await get(lockRef)
        const existingLock = lockSnapshot.val() as LockData | null

        const now = Date.now()

        // If lock exists and is not stale and not owned by current user
        if (existingLock) {
          const isStale = now - existingLock.lastHeartbeat > LOCK_TIMEOUT_MS
          const isOwnedByCurrentUser = existingLock.userId === user.uid

          if (!isStale && !isOwnedByCurrentUser) {
            // Lock is held by another user
            callbacks?.onLockFailed?.(itemId, existingLock)
            return false
          }
        }

        // Acquire lock
        const lockData: LockData = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          lockedAt: now,
          lastHeartbeat: now,
        }

        await set(lockRef, lockData)
        lockedItemsRef.current.add(itemId)

        // Start heartbeat to keep lock alive
        const heartbeatInterval = setInterval(async () => {
          try {
            await set(lockRef, {
              ...lockData,
              lastHeartbeat: Date.now(),
            })
          } catch (error) {
            console.error('Error updating lock heartbeat:', error)
          }
        }, LOCK_HEARTBEAT_INTERVAL)

        heartbeatIntervalsRef.current.set(itemId, heartbeatInterval)

        callbacks?.onLockAcquired?.(itemId)
        return true
      } catch (error) {
        console.error('Error acquiring lock:', error)
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
      const lockRef = ref(database, paths.itemLock(itemId))

      try {
        // Verify we own the lock before releasing
        const lockSnapshot = await get(lockRef)
        const existingLock = lockSnapshot.val() as LockData | null

        if (existingLock && existingLock.userId === user.uid) {
          await remove(lockRef)
          lockedItemsRef.current.delete(itemId)

          // Clear heartbeat interval
          const heartbeatInterval = heartbeatIntervalsRef.current.get(itemId)
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval)
            heartbeatIntervalsRef.current.delete(itemId)
          }

          callbacks?.onLockReleased?.(itemId)
        }
      } catch (error) {
        console.error('Error releasing lock:', error)
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
        console.error('Error checking lock:', error)
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
   */
  const releaseAllLocks = useCallback(async () => {
    const itemIds = Array.from(lockedItemsRef.current)
    await Promise.all(itemIds.map((itemId) => releaseLock(itemId)))
  }, [releaseLock])

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
          if (!lockAcquired) {
            console.warn('⚠️ [RTDB] Could not acquire lock for selected item:', itemId)
          }
        } else {
          // Clear selection
          await remove(selectionsRef)
        }
      } catch (error) {
        console.error('Error setting selection:', error)
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
