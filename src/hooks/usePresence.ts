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
import type { PresenceUser } from '../types'

interface UsePresenceReturn {
  presenceUsers: PresenceUser[]
  error: string | null
}

export const usePresence = (userId: string, userName: string): UsePresenceReturn => {
  const [presenceUsers, setPresenceUsers] = useState<PresenceUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isCleaningUpRef = useRef(false)

  // Cleanup function for current user
  const cleanupPresence = useCallback(async () => {
    if (isCleaningUpRef.current || !userId) return
    
    isCleaningUpRef.current = true
    try {
      const presenceRef = doc(firestore, 'presence', userId)
      await deleteDoc(presenceRef)
      console.log('🧹 Cleaned up presence for user:', userId)
    } catch (err) {
      console.error('❌ Error cleaning up presence:', err)
    }
  }, [userId])

  // Cleanup stale presence entries (runs every 5 minutes)
  const cleanupStalePresence = useCallback(async () => {
    try {
      const presenceRef = collection(firestore, 'presence')
      const snapshot = await getDocs(presenceRef)
      const now = Date.now()
      const STALE_THRESHOLD = 300000 // 5 minutes
      
      const staleUsers: string[] = []
      
      snapshot.forEach((doc) => {
        const data = doc.data()
        const lastSeen = data.lastSeen?.toMillis() || data.joinedAt?.toMillis() || now
        
        if (now - lastSeen > STALE_THRESHOLD) {
          staleUsers.push(doc.id)
        }
      })
      
      // Remove stale users
      for (const userId of staleUsers) {
        try {
          await deleteDoc(doc(firestore, 'presence', userId))
          console.log('🧹 Removed stale presence for user:', userId)
        } catch (err) {
          console.error('❌ Error removing stale presence:', err)
        }
      }
    } catch (err) {
      console.error('❌ Error cleaning up stale presence:', err)
    }
  }, [])

  // Write user presence on mount and set up heartbeat
  useEffect(() => {
    if (!userId || !userName) {
      console.log('⚠️ No userId or userName provided, skipping presence setup')
      return
    }

    const writePresence = async () => {
      try {
        const presenceRef = doc(firestore, 'presence', userId)
        const presenceData = {
          userId,
          userName,
          color: getUserColor(userId),
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp()
        }
        
        console.log('👤 Writing presence to Firestore:', presenceData)
        await setDoc(presenceRef, presenceData, { merge: true })
        setError(null)
        console.log('✅ Presence written successfully')
      } catch (err) {
        console.error('❌ Error writing presence:', err)
        setError('Failed to write presence data')
      }
    }

    writePresence()

    // Set up heartbeat to update lastSeen every 30 seconds
    heartbeatIntervalRef.current = setInterval(async () => {
      if (isCleaningUpRef.current) return
      
      try {
        const presenceRef = doc(firestore, 'presence', userId)
        await setDoc(presenceRef, { lastSeen: serverTimestamp() }, { merge: true })
        console.log('💓 Heartbeat updated for user:', userId)
      } catch (err) {
        console.error('❌ Error updating heartbeat:', err)
      }
    }, 30000) // 30 seconds

    // Set up stale cleanup every 5 minutes
    const staleCleanupInterval = setInterval(() => {
      cleanupStalePresence()
    }, 300000) // 5 minutes

    // Cleanup on page unload
    const handleBeforeUnload = () => {
      cleanupPresence()
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update lastSeen
        const presenceRef = doc(firestore, 'presence', userId)
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
  }, [userId, userName, cleanupPresence])

  // Listen to presence changes
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No userId provided, skipping presence listener setup')
      return
    }

    const presenceRef = collection(firestore, 'presence')
    
    console.log('🔍 Setting up presence listener for userId:', userId)
    console.log('🔗 Using Firestore collection: presence')
    
    const unsubscribe = onSnapshot(
      presenceRef,
      (snapshot) => {
        try {
          const presenceData: PresenceUser[] = []
          const now = Date.now()
          const OFFLINE_THRESHOLD = 60000 // 60 seconds - consider user offline if no heartbeat for 1 minute
          
          console.log('📡 Received presence data from Firestore:', snapshot.docs.length, 'documents')
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const lastSeen = data.lastSeen?.toMillis() || data.joinedAt?.toMillis() || now
            
            // Only include users who have been seen recently (within 1 minute)
            if (now - lastSeen < OFFLINE_THRESHOLD) {
              const presenceUser: PresenceUser = {
                userId: data.userId,
                userName: data.userName,
                color: data.color,
                joinedAt: data.joinedAt?.toMillis() || Date.now()
              }
              
              presenceData.push(presenceUser)
            } else {
              console.log('👻 User considered offline (no recent heartbeat):', data.userName)
            }
          })
          
          console.log('👥 Processed presence users (online only):', presenceData)
          setPresenceUsers(presenceData)
          setError(null)
        } catch (err) {
          console.error('❌ Error listening to presence:', err)
          setError('Failed to sync presence data')
        }
      },
      (err) => {
        console.error('❌ Error in presence listener:', err)
        console.error('❌ Error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        })
        setError(`Failed to connect to presence sync: ${err.message}`)
      }
    )

    return () => unsubscribe()
  }, [userId])

  return {
    presenceUsers,
    error
  }
}
