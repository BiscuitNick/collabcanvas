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
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING, CANVAS_ID } from '../lib/config'
import type { Shape } from '../types'
import { ShapeVersion } from '../types'
import { useAuth } from './useAuth'
import { getUserColor } from '../lib/utils'

interface UseShapesReturn {
  shapes: Shape[]
  createShape: (shape: Omit<Shape, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  updateShape: (id: string, updates: Partial<Shape>) => Promise<void>
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
  const [shapes, setShapes] = useState<Shape[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { updateShape: updateStoreShape, deleteShape: deleteStoreShape, setSyncStatus, clearAllShapes: clearAllShapesStore } = useCanvasStore()
  const retryCount = useRef(0)
  const isCreatingShape = useRef(false)
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const activelyEditingRef = useRef<Set<string>>(new Set())
  const shapesStateRef = useRef<Shape[]>([])
  
  const LOCK_TTL_MS = 30000 // 30 seconds
  const lockCleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    shapesStateRef.current = shapes
  }, [shapes])

  const throttledUpdate = useCallback(async (id: string, updates: Partial<Shape>) => {
    try {
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id)
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

  useEffect(() => {
    if (!user?.uid) {
      setShapes([])
      setLoading(false)
      return
    }

    const shapesRef = collection(firestore, 'canvases', CANVAS_ID, 'shapes')
    const q = query(shapesRef, orderBy('createdAt', 'asc'))
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shapesData: Shape[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          const baseShape = {
            id: doc.id,
            version: data.version || ShapeVersion.V1,
            x: data.x,
            y: data.y,
            rotation: data.rotation || 0,
            fill: data.fill,
            stroke: data.stroke,
            strokeWidth: data.strokeWidth,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lockedByUserId: data.lockedByUserId || null,
            lockedByUserName: data.lockedByUserName || null,
            lockedByUserColor: data.lockedByUserColor || null,
            lockedAt: data.lockedAt || null,
            syncStatus: 'synced' as const
          };

          if (data.type === 'rectangle') {
            shapesData.push({
              ...baseShape,
              type: 'rectangle',
              width: data.width,
              height: data.height,
            });
          } else if (data.type === 'circle') {
            shapesData.push({
              ...baseShape,
              type: 'circle',
              radius: data.radius,
            });
          }
        })
        
        const mergedShapes = shapesData.map((remoteShape) => {
          const local = shapesStateRef.current.find(s => s.id === remoteShape.id)
          const isActivelyEditing = activelyEditingRef.current.has(remoteShape.id)
          
          if (isActivelyEditing && local) {
            return local
          }
          
          return remoteShape
        })

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current)
        }
        
        updateTimeoutRef.current = setTimeout(() => {
          setShapes(mergedShapes)
          setLoading(false)
          setError(null)
          retryCount.current = 0
        }, isCreatingShape.current ? 100 : 0)
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
  }, [user?.uid])

  const createShape = useCallback(async (shapeData: Omit<Shape, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      isCreatingShape.current = true
      const shapesRef = collection(firestore, 'canvases', CANVAS_ID, 'shapes')
      const now = serverTimestamp()
      const newShape = {
        ...shapeData,
        createdAt: now,
        updatedAt: now
      }
      const docRef = await addDoc(shapesRef, newShape)
      setSyncStatus(docRef.id, 'pending')
    } catch (err) {
      console.error('Error creating shape:', err)
      setError('Failed to create shape')
    } finally {
      setTimeout(() => {
        isCreatingShape.current = false
      }, 100)
    }
  }, [setSyncStatus])

  const updateShape = useCallback(async (id: string, updates: Partial<Shape>): Promise<void> => {
    try {
      activelyEditingRef.current.add(id)
      updateStoreShape(id, updates)
      setSyncStatus(id, 'pending')
      throttledUpdate(id, updates)
    } catch (err) {
      console.error('Error updating shape:', err)
      setError('Failed to update shape')
      setSyncStatus(id, 'error')
    }
  }, [updateStoreShape, setSyncStatus, throttledUpdate])

  const deleteShape = useCallback(async (id: string): Promise<void> => {
    try {
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id)
      deleteStoreShape(id)
      await deleteDoc(shapeRef)
    } catch (err) {
      console.error('Error deleting shape:', err)
      setError('Failed to delete shape')
    }
  }, [deleteStoreShape])

  const clearAllShapes = useCallback(async (): Promise<void> => {
    try {
      const currentShapes = shapes
      setShapes([])
      clearAllShapesStore()
      const deletePromises = currentShapes.map(shape => {
        const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', shape.id)
        return deleteDoc(shapeRef)
      })
      await Promise.all(deletePromises)
    } catch (err) {
      console.error('Error clearing all shapes:', err)
      setError('Failed to clear all shapes')
    }
  }, [shapes, clearAllShapesStore])

  const lockShape = useCallback(async (id: string): Promise<void> => {
    if (!user) return
    try {
      const userColor = getUserColor(user.uid)
      console.log('🔒 Locking shape:', id, 'for user:', user.uid)
      updateStoreShape(id, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: Date.now(),
      })
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id)
      await updateDoc(shapeRef, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error locking shape:', err)
      setError('Failed to lock shape')
    }
  }, [user, updateStoreShape, setError])

  const unlockShape = useCallback(async (id: string): Promise<void> => {
    try {
      console.log('🔓 Unlocking shape:', id)
      updateStoreShape(id, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      })
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id)
      await updateDoc(shapeRef, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      })
    } catch (err) {
      console.error('Error unlocking shape:', err)
      setError('Failed to unlock shape')
    }
  }, [updateStoreShape, setError])

  const startEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.add(id)
    console.log('✏️ Started editing shape:', id)
    setTimeout(() => {
      if (activelyEditingRef.current.has(id)) {
        activelyEditingRef.current.delete(id)
        console.log('⏰ Auto-stopped editing shape (timeout):', id)
      }
    }, 5000)
  }, [])

  const stopEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.delete(id)
    console.log('✏️ Stopped editing shape:', id)
  }, [])

  const retry = useCallback(async () => {
    try {
      setError(null)
      retryCount.current = 0
    } catch (err) {
      console.error('Error retrying operations:', err)
      setError('Failed to retry operations')
    }
  }, [])

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
      staleShapes.forEach(shapeId => {
        updateStoreShape(shapeId, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        })
        const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', shapeId)
        updateDoc(shapeRef, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        }).catch(() => {
          // Silent cleanup
        })
      })
    }
    lockCleanupIntervalRef.current = setInterval(cleanupStaleLocks, 10000)
    return () => {
      if (lockCleanupIntervalRef.current) {
        clearInterval(lockCleanupIntervalRef.current)
      }
    }
  }, [updateStoreShape])

  useEffect(() => {
    return () => {
      // Cleanup logic if needed
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
