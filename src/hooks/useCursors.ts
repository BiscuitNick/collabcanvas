import { useState, useEffect, useCallback, useRef } from 'react'
import {
  collection,
  doc,
  setDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { getUserColor } from '../lib/utils'
import { useCanvasId } from '../contexts/CanvasContext'
import { CURSOR_THROTTLE_MS, CURSOR_DEBOUNCE_MS, ENABLE_PERFORMANCE_LOGGING } from '../lib/config'
import type { Cursor } from '../types'

interface UseCursorsReturn {
  cursors: Cursor[]
  updateCursor: (x: number, y: number) => void
  error: string | null
}

export const useCursors = (userId: string, userName: string): UseCursorsReturn => {
  const canvasId = useCanvasId()
  const [cursors, setCursors] = useState<Cursor[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null)

  // Throttled cursor updates with debouncing for mouse movement
  // x,y MUST be canvas coordinates (pre-transform)
  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now()
    
    // Store the latest position for debouncing
    pendingUpdateRef.current = { x, y }
    
    // Clear existing timeout
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }

    // Debounce: only update after configured delay
    throttleTimeoutRef.current = setTimeout(async () => {
      const pendingUpdate = pendingUpdateRef.current
      if (!pendingUpdate) return

      // Throttle: only update if enough time has passed since last update
      if (now - lastUpdateRef.current >= CURSOR_THROTTLE_MS) {
        const startTime = ENABLE_PERFORMANCE_LOGGING ? performance.now() : 0

        try {
          const cursorRef = doc(firestore, 'canvases', canvasId, 'cursors', userId)
          
          // Store absolute coordinates in canvas space
          const cursorData = {
            userId,
            userName,
            x: pendingUpdate.x,
            y: pendingUpdate.y,
            color: getUserColor(userId),
            lastUpdated: serverTimestamp()
          }
          
          await setDoc(cursorRef, cursorData, { merge: true })
          lastUpdateRef.current = now
          pendingUpdateRef.current = null
          setError(null)
          
          if (ENABLE_PERFORMANCE_LOGGING) {
            const duration = performance.now() - startTime
            console.log(`🎯 Cursor update took ${duration.toFixed(2)}ms`)
          }
        } catch (err) {
          console.error('❌ Error updating cursor:', err)
          setError('Failed to update cursor position')
        }
      }
    }, CURSOR_DEBOUNCE_MS)
  }, [userId, userName, canvasId])

  // Listen to cursor changes
  useEffect(() => {
    if (!userId) {
      return
    }

    const cursorsRef = collection(firestore, 'canvases', canvasId, 'cursors')
    const q = query(cursorsRef, orderBy('lastUpdated', 'desc'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const cursorsData: Cursor[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const now = Date.now()
            const lastUpdated = data.lastUpdated?.toMillis() || Date.now()
            
            // Only include cursors that have been updated recently (within 30 seconds)
            if (now - lastUpdated > 30000) {
              return
            }
            
            // Use coordinates as-is since they're now stored as absolute coordinates
            const screenX = data.x
            const screenY = data.y
            
            const cursor: Cursor = {
              userId: data.userId,
              userName: data.userName,
              x: screenX,
              y: screenY,
              color: data.color,
              lastUpdated: lastUpdated
            }
            
            // Don't do viewport culling for cursors - there are very few of them
            // and the complexity of getting the viewport calculation right isn't worth it
            // Cursors are already filtered by time (30 second threshold above)
            cursorsData.push({
              ...cursor,
              isVisible: true, // Always visible
              isCurrentUser: cursor.userId === userId
            })
          })
          
          setCursors(cursorsData)
          setError(null)
        } catch (err) {
          console.error('❌ Error listening to cursors:', err)
          setError('Failed to sync cursor data')
        }
      },
      (err) => {
        console.error('❌ Error in cursor listener:', err)
        console.error('❌ Error details:', {
          code: err.code,
          message: err.message,
          stack: err.stack
        })
        setError(`Failed to connect to cursor sync: ${err.message}`)
      }
    )

    return () => unsubscribe()
  }, [userId, canvasId])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear throttle timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
      
      // Clear pending update
      pendingUpdateRef.current = null
      
      // Remove own cursor from Firestore
      if (userId) {
        try {
          const cursorRef = doc(firestore, 'canvases', canvasId, 'cursors', userId)
          deleteDoc(cursorRef)
          console.log('🧹 Cleaned up cursor on unmount')
        } catch (err) {
          console.error('Error removing cursor on unmount:', err)
        }
      }
    }
  }, [userId, canvasId])

  return {
    cursors,
    updateCursor,
    error
  }
}