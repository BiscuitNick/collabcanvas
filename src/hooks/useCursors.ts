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
  updateCursor: (x: number, y: number) => void
  error: string | null
}

export const useCursors = (userId: string, userName: string): UseCursorsReturn => {
  const [cursors, setCursors] = useState<Cursor[]>([])
  const [error, setError] = useState<string | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Throttle cursor updates to 50ms
  const updateCursor = useCallback((x: number, y: number) => {
    const now = Date.now()
    
    console.log('🖱️ updateCursor called:', { x, y, userId, userName })
    
    // Clear existing timeout
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }

    // Throttle to 50ms
    throttleTimeoutRef.current = setTimeout(async () => {
      if (now - lastUpdateRef.current >= 50) {
        try {
          const cursorRef = doc(firestore, 'cursors', userId)
          const cursorData = {
            userId,
            userName,
            x,
            y,
            color: getUserColor(userId),
            lastUpdated: serverTimestamp()
          }
          
          console.log('📝 Writing cursor to Firestore:', cursorData)
          await setDoc(cursorRef, cursorData, { merge: true })
          lastUpdateRef.current = now
          setError(null)
          console.log('✅ Cursor updated successfully')
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
    
    console.log('🔍 Setting up cursor listener for userId:', userId)
    console.log('🔗 Using Firestore collection: cursors')
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const cursorsData: Cursor[] = []
          
          console.log('📡 Received cursor data from Firestore:', snapshot.docs.length, 'documents')
          
          snapshot.forEach((doc) => {
            const data = doc.data()
            const cursor: Cursor = {
              userId: data.userId,
              userName: data.userName,
              x: data.x,
              y: data.y,
              color: data.color,
              lastUpdated: data.lastUpdated?.toMillis() || Date.now()
            }
            
            // Only include cursors from other users, not the current user
            if (cursor.userId !== userId) {
              cursorsData.push(cursor)
            }
          })
          
          console.log('👥 Processed cursors (excluding own):', cursorsData)
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
  }, [userId])

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