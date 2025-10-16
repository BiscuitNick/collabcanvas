import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import { useCanvasStore } from '../store/canvasStore'
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING } from '../lib/config'
import type { Rectangle } from '../types'
import { useAuth } from './useAuth'
import { getUserColor } from '../lib/utils'

interface UseShapesReturn {
  shapes: Rectangle[]
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateShape: (id: string, updates: Partial<Rectangle>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  clearAllShapes: () => Promise<void>
  loading: boolean
  error: string | null
  retry: () => void
  lockShape: (id: string) => Promise<void>
  unlockShape: (id: string) => Promise<void>
  startEditingShape: (id: string) => void
  stopEditingShape: (id: string) => void
}

export const useShapes = (): UseShapesReturn => {
  const { user } = useAuth()
  const [shapes, setShapes] = useState<Rectangle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updateShape: updateStoreShape, deleteShape: deleteStoreShape, setSyncStatus, clearAllShapes: clearAllShapesStore } = useCanvasStore()
  const retryCount = useRef(0)
  const isCreatingShape = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track shapes that the current user is actively editing - ignore ALL Firestore updates for these
  const activelyEditingRef = useRef<Set<string>>(new Set())
  const shapesStateRef = useRef<Rectangle[]>([])
  
  // Lock TTL and cleanup
  const LOCK_TTL_MS = 30000 // 30 seconds
  const lockCleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    shapesStateRef.current = shapes
  }, [shapes])

  // Throttled update function
  const throttledUpdate = useCallback(async (id: string, updates: Partial<Rectangle>) => {
    try {
      const shapeRef = doc(firestore, 'shapes', id)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      }
      
      await updateDoc(shapeRef, updateData)
      setSyncStatus(id, 'synced')
      retryCount.current = 0
    } catch (err) {
      console.error('Error updating shape:', err)
      setSyncStatus(id, 'error')
      setError('Failed to update shape')
      
      // Retry logic
      if (retryCount.current < SHAPE_MAX_RETRIES) {
        retryCount.current++
        const retryDelay = SHAPE_RETRY_DELAY_MS * retryCount.current
        setTimeout(() => throttledUpdate(id, updates), retryDelay)
        
        if (ENABLE_PERFORMANCE_LOGGING) {
          console.log(`🔄 Shape update retry ${retryCount.current}/${SHAPE_MAX_RETRIES} in ${retryDelay}ms`)
        }
      }
    }
  }, [setSyncStatus, setError])

  // Listen to shapes changes
  useEffect(() => {
    const shapesRef = collection(firestore, 'shapes')
    const q = query(shapesRef, orderBy('createdAt', 'asc'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shapesData: Rectangle[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          shapesData.push({
            id: doc.id,
            x: data.x,
            y: data.y,
            width: data.width,
            height: data.height,
            rotation: data.rotation || 0, // Default to 0 if rotation doesn't exist
            fill: data.fill,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lockedByUserId: data.lockedByUserId || null,
            lockedByUserName: data.lockedByUserName || null,
            lockedByUserColor: data.lockedByUserColor || null,
            lockedAt: data.lockedAt || null,
            syncStatus: 'synced'
          })
        })
        
        // COMPLETELY IGNORE Firestore updates for shapes the current user is actively editing OR has locked
        const mergedShapes = shapesData.map((remoteShape) => {
          const local = shapesStateRef.current.find(s => s.id === remoteShape.id)
          
          // If current user is actively editing this shape OR has it locked, use ONLY local state
          const isActivelyEditing = activelyEditingRef.current.has(remoteShape.id)
          const isLockedByCurrentUser = remoteShape.lockedByUserId && user?.uid && remoteShape.lockedByUserId === user.uid
          
          if ((isActivelyEditing || isLockedByCurrentUser) && local) {
            return local // Use local state completely, ignore all Firestore data
          }
          
          // Log Firestore updates for non-editing, non-locked shapes only
          if (!isActivelyEditing && !isLockedByCurrentUser && local && (
            local.x !== remoteShape.x || 
            local.y !== remoteShape.y || 
            local.width !== remoteShape.width || 
            local.height !== remoteShape.height || 
            local.rotation !== remoteShape.rotation
          )) {
            console.log('📥 Firestore update received for shape:', remoteShape.id, {
              from: { x: local.x, y: local.y, width: local.width, height: local.height, rotation: local.rotation },
              to: { x: remoteShape.x, y: remoteShape.y, width: remoteShape.width, height: remoteShape.height, rotation: remoteShape.rotation }
            })
          }
          
          // For all other shapes, use Firestore data (with lock info preserved)
          return remoteShape
        })

        // Debounced update to prevent rapid re-renders during shape creation
        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          setShapes(mergedShapes)
          setLoading(false)
          setError(null)
          retryCount.current = 0
        }, isCreatingShape.current ? 100 : 0) // Longer delay if creating shape
      },
      (err) => {
        console.error('Error listening to shapes:', err)
        setError('Failed to sync shapes')
        setLoading(false)
      }
    )

    return () => {
      unsubscribe()
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [])

  // Create shape
  const createShape = useCallback(async (shapeData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      isCreatingShape.current = true

      const shapesRef = collection(firestore, 'shapes')
      const now = serverTimestamp()

      const newShape = {
        ...shapeData,
        createdAt: now,
        updatedAt: now
      }

      const docRef = await addDoc(shapesRef, newShape)

      // Don't do optimistic update to prevent double rendering
      // The Firestore snapshot will handle the update
      setSyncStatus(docRef.id, 'pending')

    } catch (err) {
      console.error('Error creating shape:', err)
      setError('Failed to create shape')
    } finally {
      // Reset the flag after a short delay to allow Firestore update to complete
      setTimeout(() => {
        isCreatingShape.current = false
      }, 100)
    }
  }, [setSyncStatus])

  // Update shape with throttling
  const updateShape = useCallback(async (id: string, updates: Partial<Rectangle>): Promise<void> => {
    try {
      // Mark this shape as actively being edited
      activelyEditingRef.current.add(id)
      
      // Update local store immediately (optimistic update)
      updateStoreShape(id, { ...updates, syncStatus: 'pending' })
      setSyncStatus(id, 'pending')
      
      // Throttled Firestore update
      throttledUpdate(id, updates)
      
    } catch (err) {
      console.error('Error updating shape:', err)
      setError('Failed to update shape')
      setSyncStatus(id, 'error')
    }
  }, [updateStoreShape, setSyncStatus, throttledUpdate])

  // Delete shape
  const deleteShape = useCallback(async (id: string): Promise<void> => {
    try {
      const shapeRef = doc(firestore, 'shapes', id)

      // Optimistic update
      deleteStoreShape(id)

      await deleteDoc(shapeRef)

    } catch (err) {
      console.error('Error deleting shape:', err)
      setError('Failed to delete shape')
    }
  }, [deleteStoreShape])

  // Clear all shapes
  const clearAllShapes = useCallback(async (): Promise<void> => {
    try {
      // Get all current shapes
      const currentShapes = shapes

      // Clear local state immediately (optimistic update)
      setShapes([])
      clearAllShapesStore()

      // Delete all shapes from Firestore in parallel
      const deletePromises = currentShapes.map(shape => {
        const shapeRef = doc(firestore, 'shapes', shape.id)
        return deleteDoc(shapeRef)
      })

      await Promise.all(deletePromises)

    } catch (err) {
      console.error('Error clearing all shapes:', err)
      setError('Failed to clear all shapes')
    }
  }, [shapes, clearAllShapesStore])

  // Lock a shape for current user
  const lockShape = useCallback(async (id: string): Promise<void> => {
    if (!user) return
    try {
      const userColor = getUserColor(user.uid)
      console.log('🔒 Locking shape:', id, 'for user:', user.uid, 'with color:', userColor)
      // Optimistic local lock
      updateStoreShape(id, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: Date.now(),
      })
      const shapeRef = doc(firestore, 'shapes', id)
      await updateDoc(shapeRef, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: serverTimestamp(),
      })
      console.log('✅ Shape locked successfully:', id, 'Color stored:', userColor)
    } catch (err) {
      console.error('Error locking shape:', err)
      setError('Failed to lock shape')
    }
  }, [user, updateStoreShape, setError])

  // Unlock a shape
  const unlockShape = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🔓 Unlocking shape:', id)
      // Optimistic local unlock
      updateStoreShape(id, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      })
      const shapeRef = doc(firestore, 'shapes', id)
      await updateDoc(shapeRef, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      })
      console.log('✅ Shape unlocked successfully:', id)
    } catch (err) {
      console.error('Error unlocking shape:', err)
      setError('Failed to unlock shape')
    }
  }, [updateStoreShape, setError])

  // Start editing a shape - ignore all Firestore updates for this shape
  const startEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.add(id)
    console.log('✏️ Started editing shape:', id)
  }, [])

  // Stop editing a shape - resume Firestore updates for this shape
  const stopEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.delete(id)
    console.log('✏️ Stopped editing shape:', id)
  }, [])

  // Retry failed operations
  const retry = useCallback(async () => {
    try {
      setError(null)
      retryCount.current = 0
      
      // Retry pending updates
      // The pendingUpdates.current logic has been removed as it was redundant.
      // Optimistic updates are handled by updateStoreShape, and the onSnapshot listener
      // is the single source of truth for the shapes array.
      
    } catch (err) {
      console.error('Error retrying operations:', err)
      setError('Failed to retry operations')
    }
  }, [])

  // Auto-cleanup stale locks
  useEffect(() => {
    const cleanupStaleLocks = () => {
      const now = Date.now()
      const staleShapes: string[] = []
      
      shapesStateRef.current.forEach(shape => {
        if (shape.lockedByUserId && shape.lockedAt) {
          const lockTime = typeof shape.lockedAt === 'number' ? shape.lockedAt : shape.lockedAt.getTime()
          if (now - lockTime > LOCK_TTL_MS) {
            staleShapes.push(shape.id)
          }
        }
      })
      
      // Unlock stale shapes
      staleShapes.forEach(shapeId => {
        updateStoreShape(shapeId, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        })
        
        // Update Firestore
        const shapeRef = doc(firestore, 'shapes', shapeId)
        updateDoc(shapeRef, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        }).catch(() => {
          // Silent cleanup - no logging
        })
      })
    }
    
    // Run cleanup every 10 seconds
    lockCleanupIntervalRef.current = setInterval(cleanupStaleLocks, 10000)
    
    return () => {
      if (lockCleanupIntervalRef.current) {
        clearInterval(lockCleanupIntervalRef.current)
      }
    }
  }, [])

  // Clean up pending updates on unmount
  useEffect(() => {
    return () => {
      // The pendingUpdates.current.clear() logic has been removed as pendingUpdates is no longer used.
    }
  }, [])

  return {
    shapes,
    createShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    loading,
    error,
    retry,
    lockShape,
    unlockShape,
    startEditingShape,
    stopEditingShape
  }
}
