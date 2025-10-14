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

// Throttle function for updates
const throttle = (func: Function, delay: number) => {
  let timeoutId: NodeJS.Timeout | null = null
  let lastExecTime = 0
  return (...args: any[]) => {
    const currentTime = Date.now()
    
    if (currentTime - lastExecTime > delay) {
      func(...args)
      lastExecTime = currentTime
    } else {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func(...args)
        lastExecTime = Date.now()
      }, delay - (currentTime - lastExecTime))
    }
  }
}

export const useShapes = (): UseShapesReturn => {
  const [shapes, setShapes] = useState<Rectangle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addShape, updateShape: updateStoreShape, deleteShape: deleteStoreShape, setSyncStatus, clearAllShapes: clearAllShapesStore } = useCanvasStore()
  const pendingUpdates = useRef<Map<string, Partial<Rectangle>>>(new Map())
  const retryCount = useRef(0)
  const maxRetries = 3

  // Throttled update function
  const throttledUpdate = useCallback(
    throttle(async (id: string, updates: Partial<Rectangle>) => {
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
        if (retryCount.current < maxRetries) {
          retryCount.current++
          setTimeout(() => throttledUpdate(id, updates), 1000 * retryCount.current)
        }
      }
    }, 300), // 300ms throttle
    [setSyncStatus, setError]
  )

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
      // Store pending update
      pendingUpdates.current.set(id, updates)
      
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
      for (const [id, updates] of pendingUpdates.current) {
        await throttledUpdate(id, updates)
      }
      
    } catch (err) {
      console.error('Error retrying operations:', err)
      setError('Failed to retry operations')
    }
  }, [throttledUpdate])

  // Clean up pending updates on unmount
  useEffect(() => {
    return () => {
      pendingUpdates.current.clear()
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
