import { useEffect, useState, useCallback } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { firestore } from '../lib/firebase'
import type { Canvas, CanvasVisibility, CanvasPermission } from './useCanvases'

interface UseCanvasMetadataReturn {
  canvas: Canvas | null
  loading: boolean
  error: Error | null
  canView: boolean
  canEdit: boolean
  isCreator: boolean
  updateVisibility: (visibility: CanvasVisibility) => Promise<void>
  updatePublicCanEdit: (canEdit: boolean) => Promise<void>
  addPermission: (permission: CanvasPermission) => Promise<void>
  removePermission: (userId: string) => Promise<void>
  updatePermission: (userId: string, role: 'view' | 'edit') => Promise<void>
}

export function useCanvasMetadata(canvasId: string, userId?: string): UseCanvasMetadataReturn {
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchCanvas = useCallback(async () => {
    try {
      setLoading(true)
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)

      if (!canvasDoc.exists()) {
        throw new Error('Canvas not found')
      }

      const data = canvasDoc.data()
      const canvasData: Canvas = {
        id: canvasDoc.id,
        name: data.name || canvasDoc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        createdBy: data.createdBy || '',
        createdByName: data.createdByName || '',
        visibility: data.visibility || 'private',
        publicCanEdit: data.publicCanEdit || false,
        permissions: data.permissions || []
      }

      setCanvas(canvasData)
      setError(null)
    } catch (err) {
      console.error('Error fetching canvas:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [canvasId])

  useEffect(() => {
    fetchCanvas()
  }, [fetchCanvas])

  // Check if user can view
  const canView = canvas ? (
    canvas.visibility === 'public' ||
    canvas.visibility === 'unlisted' ||
    canvas.createdBy === userId ||
    canvas.permissions.some(p => p.userId === userId)
  ) : false

  // Check if user can edit
  const canEdit = canvas ? (
    canvas.createdBy === userId ||
    (canvas.visibility === 'public' && canvas.publicCanEdit) ||
    (canvas.visibility === 'unlisted' && canvas.publicCanEdit) ||
    canvas.permissions.some(p => p.userId === userId && p.role === 'edit')
  ) : false

  const isCreator = canvas ? canvas.createdBy === userId : false

  const updateVisibility = useCallback(async (visibility: CanvasVisibility) => {
    if (!canvas || !isCreator) {
      throw new Error('Only the creator can change visibility')
    }

    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      await updateDoc(canvasRef, { visibility })
      await fetchCanvas()
    } catch (err) {
      console.error('Error updating visibility:', err)
      throw err
    }
  }, [canvas, isCreator, canvasId, fetchCanvas])

  const updatePublicCanEdit = useCallback(async (publicCanEdit: boolean) => {
    if (!canvas || !isCreator) {
      throw new Error('Only the creator can change edit permissions')
    }

    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      await updateDoc(canvasRef, { publicCanEdit })
      await fetchCanvas()
    } catch (err) {
      console.error('Error updating public edit permission:', err)
      throw err
    }
  }, [canvas, isCreator, canvasId, fetchCanvas])

  const addPermission = useCallback(async (permission: CanvasPermission) => {
    if (!canvas || !isCreator) {
      throw new Error('Only the creator can add permissions')
    }

    try {
      const newPermissions = [...canvas.permissions, permission]
      const canvasRef = doc(firestore, 'canvases', canvasId)
      await updateDoc(canvasRef, { permissions: newPermissions })
      await fetchCanvas()
    } catch (err) {
      console.error('Error adding permission:', err)
      throw err
    }
  }, [canvas, isCreator, canvasId, fetchCanvas])

  const removePermission = useCallback(async (userIdToRemove: string) => {
    if (!canvas || !isCreator) {
      throw new Error('Only the creator can remove permissions')
    }

    try {
      const newPermissions = canvas.permissions.filter(p => p.userId !== userIdToRemove)
      const canvasRef = doc(firestore, 'canvases', canvasId)
      await updateDoc(canvasRef, { permissions: newPermissions })
      await fetchCanvas()
    } catch (err) {
      console.error('Error removing permission:', err)
      throw err
    }
  }, [canvas, isCreator, canvasId, fetchCanvas])

  const updatePermission = useCallback(async (userIdToUpdate: string, role: 'view' | 'edit') => {
    if (!canvas || !isCreator) {
      throw new Error('Only the creator can update permissions')
    }

    try {
      const newPermissions = canvas.permissions.map(p =>
        p.userId === userIdToUpdate ? { ...p, role } : p
      )
      const canvasRef = doc(firestore, 'canvases', canvasId)
      await updateDoc(canvasRef, { permissions: newPermissions })
      await fetchCanvas()
    } catch (err) {
      console.error('Error updating permission:', err)
      throw err
    }
  }, [canvas, isCreator, canvasId, fetchCanvas])

  return {
    canvas,
    loading,
    error,
    canView,
    canEdit,
    isCreator,
    updateVisibility,
    updatePublicCanEdit,
    addPermission,
    removePermission,
    updatePermission
  }
}
