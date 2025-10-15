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

interface UseShapesReturn {
  shapes: Rectangle[]
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateShape: (id: string, updates: Partial<Rectangle>) => Promise<void>
  deleteShape: (id: string) => Promise<void>
  clearAllShapes: () => Promise<void>
  loading: boolean
  error: string | null
  retry: () => void
}

export const useShapes = (): UseShapesReturn => {
  const [shapes, setShapes] = useState<Rectangle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addShape, updateShape: updateStoreShape, deleteShape: deleteStoreShape, setSyncStatus, clearAllShapes: clearAllShapesStore } = useCanvasStore()
  const retryCount = useRef(0)

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
            syncStatus: 'synced'
          })
        })
        
        setShapes(shapesData)
        setLoading(false)
        setError(null)
        retryCount.current = 0
      },
      (err) => {
        console.error('Error listening to shapes:', err)
        setError('Failed to sync shapes')
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])

  // Create shape
  const createShape = useCallback(async (shapeData: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      setLoading(true)
      const shapesRef = collection(firestore, 'shapes')
      const now = serverTimestamp()
      
      const newShape = {
        ...shapeData,
        createdAt: now,
        updatedAt: now
      }
      
      const docRef = await addDoc(shapesRef, newShape)
      
      // Optimistic update
      const optimisticShape: Rectangle = {
        ...shapeData,
        id: docRef.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        syncStatus: 'pending'
      }
      
      addShape(optimisticShape)
      setSyncStatus(docRef.id, 'pending')
      
    } catch (err) {
      console.error('Error creating shape:', err)
      setError('Failed to create shape')
    } finally {
      setLoading(false)
    }
  }, [addShape, setSyncStatus])

  // Update shape with throttling
  const updateShape = useCallback(async (id: string, updates: Partial<Rectangle>): Promise<void> => {
    try {
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
      setLoading(true)
      const shapeRef = doc(firestore, 'shapes', id)
      
      // Optimistic update
      deleteStoreShape(id)
      
      await deleteDoc(shapeRef)
      
    } catch (err) {
      console.error('Error deleting shape:', err)
      setError('Failed to delete shape')
    } finally {
      setLoading(false)
    }
  }, [deleteStoreShape])

  // Clear all shapes
  const clearAllShapes = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      
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
    } finally {
      setLoading(false)
    }
  }, [shapes, clearAllShapesStore])

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
    retry
  }
}
