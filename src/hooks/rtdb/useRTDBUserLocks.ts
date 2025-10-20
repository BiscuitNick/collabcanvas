import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, PRESENCE_OFFLINE_THRESHOLD } from '../../lib/rtdb-config'
import { useAuth } from '../useAuth'

interface UserLockInfo {
  userId: string
  userName: string
  lockedItemId: string | null
}

/**
 * Hook to track which items are locked by which users
 * Uses ONLY presence data as the single source of truth
 */
export const useRTDBUserLocks = (canvasId: string | null) => {
  const { user } = useAuth()
  const [userLocks, setUserLocks] = useState<Map<string, UserLockInfo>>(new Map())

  useEffect(() => {
    if (!canvasId) return

    // Check if RTDB is enabled
    const enableRTDB = localStorage.getItem('enableRTDB')
    if (enableRTDB === 'false') return

    const paths = getRTDBPaths(canvasId)
    const presenceRef = ref(database, paths.presence)

    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const presenceData = snapshot.val() as Record<string, {
        userId: string
        userName: string
        lockedItemId: string | null
        lastSeen: number
      }> | null

      if (!presenceData) {
        setUserLocks(new Map())
        return
      }

      const now = Date.now()
      const locks = new Map<string, UserLockInfo>()

      // Build map of active users and their locks
      Object.values(presenceData).forEach(presence => {
        // Only consider active users
        if (now - presence.lastSeen > PRESENCE_OFFLINE_THRESHOLD) return

        locks.set(presence.userId, {
          userId: presence.userId,
          userName: presence.userName,
          lockedItemId: presence.lockedItemId
        })
      })

      setUserLocks(locks)
    })

    return () => unsubscribe()
  }, [canvasId])

  /**
   * Get the user who has locked a specific item
   */
  const getItemLock = (itemId: string): UserLockInfo | null => {
    for (const lockInfo of userLocks.values()) {
      if (lockInfo.lockedItemId === itemId) {
        return lockInfo
      }
    }
    return null
  }

  /**
   * Check if an item is locked by another user
   */
  const isLockedByOther = (itemId: string): boolean => {
    const lock = getItemLock(itemId)
    return lock !== null && lock.userId !== user?.uid
  }

  /**
   * Check if an item is locked by current user
   */
  const isLockedByCurrentUser = (itemId: string): boolean => {
    const lock = getItemLock(itemId)
    return lock !== null && lock.userId === user?.uid
  }

  /**
   * Get what item the current user has locked
   */
  const getCurrentUserLockedItem = (): string | null => {
    if (!user?.uid) return null
    const lockInfo = userLocks.get(user.uid)
    return lockInfo?.lockedItemId || null
  }

  return {
    userLocks,
    getItemLock,
    isLockedByOther,
    isLockedByCurrentUser,
    getCurrentUserLockedItem
  }
}
