import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { ShapeLock } from '../types'

interface UseShapeLocksReturn {
  locks: Record<string, ShapeLock>
  startManipulation: (shapeId: string, userId: string) => Promise<boolean>
  endManipulation: (shapeId: string) => Promise<void>
  isManipulating: (shapeId: string) => boolean
  isLocked: (shapeId: string) => boolean
  getLockOwner: (shapeId: string) => string | null
  releaseAllLocks: () => Promise<void>
  error: string | null
}

export const useShapeLocks = (userId: string): UseShapeLocksReturn => {
  const [locks, setLocks] = useState<Record<string, ShapeLock>>({})
  const [error, setError] = useState<string | null>(null)
  const activityTimeouts = useRef<Record<string, NodeJS.Timeout>>({})
  const lockTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(activityTimeouts.current).forEach(clearTimeout)
      Object.values(lockTimeouts.current).forEach(clearTimeout)
    }
  }, [])

  // Listen to lock changes
  useEffect(() => {
    const locksRef = collection(firestore, 'locks')
    const unsubscribe = onSnapshot(
      locksRef,
      (snapshot) => {
        const locksData: Record<string, ShapeLock> = {}
        snapshot.forEach((doc) => {
          const data = doc.data()
          locksData[doc.id] = {
            shapeId: doc.id,
            lockedBy: data.lockedBy,
            lockedAt: data.lockedAt,
            expiresAt: data.expiresAt,
            isManipulating: data.isManipulating || false,
            lastActivity: data.lastActivity || data.lockedAt
          }
        })
        setLocks(locksData)
        setError(null)
      },
      (err) => {
        console.error('Error listening to locks:', err)
        setError('Failed to sync lock data')
      }
    )

    return () => unsubscribe()
  }, [])

  // Start manipulation - acquire lock and start activity timer
  const startManipulation = useCallback(async (shapeId: string, userId: string): Promise<boolean> => {
    try {
      const lockRef = doc(firestore, 'locks', shapeId)
      const now = serverTimestamp()
      const expiresAt = new Date(Date.now() + 1000) // 1 second from now

      const lockData: Omit<ShapeLock, 'shapeId'> = {
        lockedBy: userId,
        lockedAt: now,
        expiresAt: Timestamp.fromDate(expiresAt),
        isManipulating: true,
        lastActivity: now
      }

      await setDoc(lockRef, lockData)
      
      // Clear any existing timeout
      if (activityTimeouts.current[shapeId]) {
        clearTimeout(activityTimeouts.current[shapeId])
      }
      if (lockTimeouts.current[shapeId]) {
        clearTimeout(lockTimeouts.current[shapeId])
      }

      // Set up activity timeout (1 second)
      activityTimeouts.current[shapeId] = setTimeout(() => {
        endManipulation(shapeId)
      }, 1000)

      return true
    } catch (err) {
      console.error('Error starting manipulation:', err)
      setError('Failed to acquire lock')
      return false
    }
  }, [])

  // End manipulation - start countdown to unlock
  const endManipulation = useCallback(async (shapeId: string): Promise<void> => {
    try {
      const lockRef = doc(firestore, 'locks', shapeId)
      const now = serverTimestamp()
      const expiresAt = new Date(Date.now() + 1000) // 1 second from now

      // Get current lock data to preserve existing values
      const currentLock = locks[shapeId]
      if (!currentLock) {
        console.warn('No lock found for shape:', shapeId)
        // If no lock exists, just clear timeouts and return
        if (activityTimeouts.current[shapeId]) {
          clearTimeout(activityTimeouts.current[shapeId])
          delete activityTimeouts.current[shapeId]
        }
        return
      }

      // Update lock to indicate manipulation ended
      await setDoc(lockRef, {
        lockedBy: currentLock.lockedBy,
        lockedAt: currentLock.lockedAt,
        expiresAt: Timestamp.fromDate(expiresAt),
        isManipulating: false,
        lastActivity: now
      }, { merge: true })

      // Clear activity timeout
      if (activityTimeouts.current[shapeId]) {
        clearTimeout(activityTimeouts.current[shapeId])
        delete activityTimeouts.current[shapeId]
      }

      // Set up lock timeout (1 second)
      lockTimeouts.current[shapeId] = setTimeout(async () => {
        try {
          await deleteDoc(lockRef)
          delete lockTimeouts.current[shapeId]
        } catch (err) {
          console.error('Error releasing lock:', err)
        }
      }, 1000)

    } catch (err) {
      console.error('Error ending manipulation:', err)
      console.error('Shape ID:', shapeId)
      console.error('Current locks:', locks)
      console.error('Current lock for shape:', locks[shapeId])
      setError(`Failed to update lock: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }, [locks])

  // Check if shape is being manipulated
  const isManipulating = useCallback((shapeId: string): boolean => {
    const lock = locks[shapeId]
    return lock ? lock.isManipulating && lock.lockedBy === userId : false
  }, [locks, userId])

  // Check if shape is locked by anyone
  const isLocked = useCallback((shapeId: string): boolean => {
    const lock = locks[shapeId]
    if (!lock) return false
    
    // Check if lock has expired
    const now = new Date()
    const expiresAt = lock.expiresAt instanceof Timestamp 
      ? lock.expiresAt.toDate() 
      : new Date(lock.expiresAt)
    
    return expiresAt > now
  }, [locks])

  // Get lock owner
  const getLockOwner = useCallback((shapeId: string): string | null => {
    const lock = locks[shapeId]
    return lock && isLocked(shapeId) ? lock.lockedBy : null
  }, [locks, isLocked])

  // Release all locks for current user
  const releaseAllLocks = useCallback(async (): Promise<void> => {
    try {
      const promises = Object.entries(locks)
        .filter(([_, lock]) => lock.lockedBy === userId)
        .map(([shapeId, _]) => deleteDoc(doc(firestore, 'locks', shapeId)))
      
      await Promise.all(promises)
      
      // Clear all timeouts
      Object.values(activityTimeouts.current).forEach(clearTimeout)
      Object.values(lockTimeouts.current).forEach(clearTimeout)
      activityTimeouts.current = {}
      lockTimeouts.current = {}
    } catch (err) {
      console.error('Error releasing all locks:', err)
      setError('Failed to release locks')
    }
  }, [locks, userId])

  return {
    locks,
    startManipulation,
    endManipulation,
    isManipulating,
    isLocked,
    getLockOwner,
    releaseAllLocks,
    error
  }
}
