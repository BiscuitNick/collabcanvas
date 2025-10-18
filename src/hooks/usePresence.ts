import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { getUserColor } from '../lib/utils'
import { useCanvasId } from '../contexts/CanvasContext'
import { STALE_PRESENCE_THRESHOLD, OFFLINE_PRESENCE_THRESHOLD } from '../lib/constants'
import { PRESENCE_UPDATE_INTERVAL_MS, PRESENCE_CLEANUP_INTERVAL_MS } from '../lib/config'
import type { PresenceUser } from '../types'

interface UsePresenceReturn {
  presenceUsers: PresenceUser[]
  error: string | null
}

export const usePresence = (userId: string, userName: string, photoURL?: string | null): UsePresenceReturn => {
  const canvasId = useCanvasId()
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCleaningUpRef = useRef(false)

  // Cleanup function for current user
  const cleanupPresence = useCallback(async () => {
    if (isCleaningUpRef.current || !userId) return
    
    isCleaningUpRef.current = true
    try {
      const presenceRef = doc(firestore, 'canvases', canvasId, 'presence', userId)
      await deleteDoc(presenceRef)
    } catch (err) {
      // Error cleaning up presence
    }
  }, [userId, canvasId])

  // Cleanup stale presence entries (runs every 5 minutes)
  const cleanupStalePresence = useCallback(async () => {
    try {
      const presenceRef = collection(firestore, 'canvases', canvasId, 'presence')
      const snapshot = await getDocs(presenceRef)
      const now = Date.now()
      
      const staleUsers: string[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        const lastSeen = data.lastSeen?.toMillis() || data.joinedAt?.toMillis() || now
        
        if (now - lastSeen > STALE_PRESENCE_THRESHOLD) {
          staleUsers.push(doc.id)
        }
      })
      
      // Remove stale users
      for (const userId of staleUsers) {
        try {
          await deleteDoc(doc(firestore, 'canvases', canvasId, 'presence', userId))
        } catch (err) {
          // Error removing stale presence
        }
      }
    } catch (err) {
      // Error cleaning up stale presence
    }
  }, [canvasId])

  // Write user presence on mount and set up heartbeat
  useEffect(() => {
    if (!userId || !userName) {
      return
    }

    const writePresence = async () => {
      try {
        const presenceRef = doc(firestore, 'canvases', canvasId, 'presence', userId)
        const presenceData = {
          userId,
          userName,
          color: getUserColor(userId),
          photoURL: photoURL || null,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp()
        }

        await setDoc(presenceRef, presenceData, { merge: true })
        setError(null)
      } catch (err) {
        setError('Failed to write presence data')
      }
    }

    writePresence()

    // Set up heartbeat to update lastSeen every 30 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      if (isCleaningUpRef.current) return

      try {
        const presenceRef = doc(firestore, 'canvases', canvasId, 'presence', userId)
        await setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true })
      } catch (err) {
        // Error updating heartbeat
      }
    }, PRESENCE_UPDATE_INTERVAL_MS)

    // Set up stale cleanup at configured interval
    const staleCleanupInterval = setInterval(() => {
      cleanupStalePresence()
    }, PRESENCE_CLEANUP_INTERVAL_MS)

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      cleanupPresence()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update lastSeen
        const presenceRef = doc(firestore, 'canvases', canvasId, 'presence', userId)
        setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      clearInterval(staleCleanupInterval)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      cleanupPresence()
    }
  }, [userId, userName, photoURL, cleanupPresence, cleanupStalePresence])

  // Listen to presence changes
  useEffect(() => {
    if (!userId) {
      return
    }

    const presenceRef = collection(firestore, 'canvases', canvasId, 'presence')

    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        try {
          const presenceData: PresenceUser[] = []
          const now = Date.now()
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const lastSeen = data.lastSeen?.toMillis() || data.joinedAt?.toMillis() || now
            
            // Only include users who have been seen recently (within 1 minute)
            if (now - lastSeen < OFFLINE_PRESENCE_THRESHOLD) {
              const presenceUser: PresenceUser = {
                userId: data.userId,
                userName: data.userName,
                color: data.color,
                photoURL: data.photoURL || null,
                joinedAt: data.joinedAt?.toMillis() || Date.now()
              }

              presenceData.push(presenceUser)
            }
          })

          setPresenceUsers(presenceData)
          setError(null)
        } catch (err) {
          setError('Failed to sync presence data')
        }
      },
      (err) => {
        setError(`Failed to connect to presence sync: ${err.message}`)
      }
    )

    return () => unsubscribe()
  }, [userId, canvasId])

  return {
    presenceUsers,
    error
  }
}
