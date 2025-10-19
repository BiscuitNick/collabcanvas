import { useEffect, useRef, useState } from 'react'
import { ref, set, onValue, onDisconnect, remove } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, PRESENCE_HEARTBEAT_INTERVAL, PRESENCE_OFFLINE_THRESHOLD, PRESENCE_CLEANUP_INTERVAL } from '../../lib/rtdb-config'
import { useAuth } from '../useAuth'
import type { User } from '../../types'

interface PresenceData {
  userId: string
  userName: string
  color: string
  photoURL: string | null
  joinedAt: number
  lastSeen: number
}

export const useRTDBPresence = (canvasId: string | null) => {
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const { user } = useAuth()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isActiveRef = useRef(true)

  useEffect(() => {
    if (!canvasId || !user) return

    // Check if RTDB is enabled (via localStorage)
    const enableRTDB = localStorage.getItem('enableRTDB')
    if (enableRTDB === 'false') {
      console.log('🚫 [RTDB Presence] RTDB disabled via localStorage')
      return
    }

    console.log('✅ [RTDB Presence] Initializing presence for user:', user.uid)

    const paths = getRTDBPaths(canvasId, user.uid)
    const presenceRef = ref(database, paths.userPresence)
    const allPresenceRef = ref(database, paths.presence)

    // Set initial presence
    const presenceData: PresenceData = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous',
      color: '#' + Math.floor(Math.random()*16777215).toString(16), // Generate random color
      photoURL: user.photoURL || null,
      joinedAt: Date.now(),
      lastSeen: Date.now(),
    }

    const updatePresence = async () => {
      if (!isActiveRef.current) return
      try {
        await set(presenceRef, {
          ...presenceData,
          lastSeen: Date.now(),
        })
      } catch (error) {
        console.error('Error updating presence:', error)
      }
    }

    // Set initial presence and configure disconnect handler
    const initializePresence = async () => {
      try {
        await set(presenceRef, presenceData)

        // Configure automatic cleanup on disconnect
        const disconnectRef = onDisconnect(presenceRef)
        await disconnectRef.remove()
      } catch (error) {
        console.error('Error initializing presence:', error)
      }
    }

    initializePresence()

    // Heartbeat to keep presence alive
    heartbeatIntervalRef.current = setInterval(updatePresence, PRESENCE_HEARTBEAT_INTERVAL)

    // Listen for all users' presence
    const unsubscribe = onValue(allPresenceRef, (snapshot) => {
      const presenceMap = snapshot.val() as Record<string, PresenceData> | null
      if (!presenceMap) {
        setActiveUsers([])
        return
      }

      const now = Date.now()
      const users: User[] = Object.values(presenceMap)
        .filter((p) => {
          // Filter out current user and offline users
          if (p.userId === user.uid) return false
          return now - p.lastSeen < PRESENCE_OFFLINE_THRESHOLD
        })
        .map((p) => ({
          uid: p.userId,
          email: null,
          displayName: p.userName,
          photoURL: p.photoURL,
        }))

      setActiveUsers(users)
    })

    // Cleanup stale presence data
    cleanupIntervalRef.current = setInterval(async () => {
      const snapshot = await new Promise<any>((resolve) => {
        onValue(allPresenceRef, resolve, { onlyOnce: true })
      })

      const presenceMap = snapshot.val() as Record<string, PresenceData> | null
      if (!presenceMap) return

      const now = Date.now()
      const staleUserIds = Object.entries(presenceMap)
        .filter(([_, p]) => now - p.lastSeen > PRESENCE_OFFLINE_THRESHOLD * 2)
        .map(([userId]) => userId)

      for (const userId of staleUserIds) {
        const staleRef = ref(database, getRTDBPaths(canvasId, userId).userPresence)
        await remove(staleRef)
      }
    }, PRESENCE_CLEANUP_INTERVAL)

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isActiveRef.current = false
      } else {
        isActiveRef.current = true
        updatePresence()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Cleanup on unmount
    return () => {
      isActiveRef.current = false
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current)
      if (cleanupIntervalRef.current) clearInterval(cleanupIntervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      unsubscribe()
      remove(presenceRef)
    }
  }, [canvasId, user])

  return { activeUsers }
}
