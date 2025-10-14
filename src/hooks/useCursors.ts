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
import type { Cursor } from '../types'

interface UseCursorsReturn {
  cursors: Cursor[]
  updateCursor: (x: number, y: number, canvasWidth?: number, canvasHeight?: number) => void
  error: string | null
}

export const useCursors = (userId: string, userName: string, canvasWidth?: number, canvasHeight?: number, stagePosition?: { x: number; y: number }, viewportWidth?: number, viewportHeight?: number, stageScale?: number): UseCursorsReturn => {
  const [cursors, setCursors] = useState<Cursor[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Throttle cursor updates to 50ms
  // x,y MUST be canvas coordinates (pre-transform)
  const updateCursor = useCallback((x: number, y: number, canvasWidth?: number, canvasHeight?: number) => {
    const now = Date.now()
    
    console.log('🖱️ updateCursor called:', { x, y, userId, userName, canvasWidth, canvasHeight })
    
    // Clear existing timeout
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }

    // Throttle to 50ms
    throttleTimeoutRef.current = setTimeout(async () => {
      if (now - lastUpdateRef.current >= 50) {
        try {
          const cursorRef = doc(firestore, 'cursors', userId)
          
          // Store absolute coordinates in canvas space
          const cursorData = {
            userId,
            userName,
            x: x, // Store as absolute coordinate
            y: y, // Store as absolute coordinate
            color: getUserColor(userId),
            lastUpdated: serverTimestamp()
          }
          
          // optional debug left in place
          
          await setDoc(cursorRef, cursorData, { merge: true })
          lastUpdateRef.current = now
          setError(null)
        } catch (err) {
          console.error('❌ Error updating cursor:', err)
          setError('Failed to update cursor position')
        }
      }
    }, 50)
  }, [userId, userName])

  // Listen to cursor changes
  useEffect(() => {
    if (!userId) {
      console.log('⚠️ No userId provided, skipping cursor listener setup')
      return
    }

    const cursorsRef = collection(firestore, 'cursors')
    const q = query(cursorsRef, orderBy('lastUpdated', 'desc'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const cursorsData: Cursor[] = []
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            
            // Use coordinates as-is since they're now stored as absolute coordinates
            const screenX = data.x
            const screenY = data.y
            
            const cursor: Cursor = {
              userId: data.userId,
              userName: data.userName,
              x: screenX,
              y: screenY,
              color: data.color,
              lastUpdated: data.lastUpdated?.toMillis() || Date.now()
            }
            
            // Debug logging for cursor positioning
            if (cursor.userId === userId) {
              console.log('🎯 Current user cursor retrieved:', {
                userId: cursor.userId,
                userName: cursor.userName,
                x: cursor.x,
                y: cursor.y,
                stagePosition,
                viewportWidth,
                viewportHeight
              })
            }
            
            // Include all cursors (including current user for debugging)
            // Check if cursor is within viewport for performance
            // Cursors are stored in canvas coordinates, so check against canvas viewport bounds
            const isInViewport = stagePosition && viewportWidth && viewportHeight && stageScale
              ? cursor.x >= -stagePosition.x / stageScale &&
                cursor.x <= (-stagePosition.x + viewportWidth) / stageScale &&
                cursor.y >= -stagePosition.y / stageScale &&
                cursor.y <= (-stagePosition.y + viewportHeight) / stageScale
              : true // Include all if viewport info not available
            
            // Always include cursor for debug info, but mark if it's visible
            cursorsData.push({
              ...cursor,
              isVisible: isInViewport,
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
  }, [userId, canvasWidth, canvasHeight, stagePosition])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      // Clear throttle timeout
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
      
      // Remove own cursor from Firestore
      if (userId) {
        try {
          const cursorRef = doc(firestore, 'cursors', userId)
          deleteDoc(cursorRef)
          console.log('🧹 Cleaned up cursor on unmount')
        } catch (err) {
          console.error('Error removing cursor on unmount:', err)
        }
      }
    }
  }, [userId])

  return {
    cursors,
    updateCursor,
    error
  }
}