import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, Timestamp, query, where, or } from 'firebase/firestore'
import { firestore } from '../lib/firebase'

export type CanvasVisibility = 'public' | 'private' | 'unlisted'

export interface CanvasPermission {
  userId: string
  userName: string
  role: 'view' | 'edit'
}

export interface Canvas {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  createdBy: string
  createdByName?: string
  visibility: CanvasVisibility
  publicCanEdit: boolean // For public/unlisted canvases
  permissions: CanvasPermission[] // For private canvases and specific user permissions
}

// Helper to generate a random canvas name
const generateCanvasName = (): string => {
  const adjectives = ['Creative', 'Bright', 'Bold', 'Dynamic', 'Epic', 'Fresh', 'Happy', 'Inspired', 'Joyful', 'Lively']
  const nouns = ['Canvas', 'Board', 'Space', 'Studio', 'Workspace', 'Project', 'Design', 'Sketch', 'Draft', 'Idea']
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const number = Math.floor(Math.random() * 1000)
  return `${adjective} ${noun} ${number}`
}

export function useCanvases(userId?: string) {
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const [publicCanvases, setPublicCanvases] = useState<Canvas[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (userId) {
      fetchCanvases(userId)
    }
  }, [userId])

  const fetchCanvases = async (currentUserId: string) => {
    try {
      setLoading(true)
      const canvasesRef = collection(firestore, 'canvases')

      // Fetch user's own canvases and canvases they have access to
      const userCanvasesQuery = query(
        canvasesRef,
        or(
          where('createdBy', '==', currentUserId),
          where('permissions', 'array-contains', { userId: currentUserId })
        )
      )

      // Fetch public canvases
      const publicCanvasesQuery = query(
        canvasesRef,
        where('visibility', '==', 'public')
      )

      const [userSnapshot, publicSnapshot] = await Promise.all([
        getDocs(userCanvasesQuery),
        getDocs(publicCanvasesQuery)
      ])

      const userCanvasList: Canvas[] = userSnapshot.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          visibility: data.visibility || 'private',
          publicCanEdit: data.publicCanEdit || false,
          permissions: data.permissions || []
        }
      })

      const publicCanvasList: Canvas[] = publicSnapshot.docs
        .filter(doc => doc.data().createdBy !== currentUserId) // Don't duplicate user's own public canvases
        .map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || '',
            visibility: data.visibility || 'private',
            publicCanEdit: data.publicCanEdit || false,
            permissions: data.permissions || []
          }
        })

      setCanvases(userCanvasList)
      setPublicCanvases(publicCanvasList)
      setError(null)
    } catch (err) {
      console.error('Error fetching canvases:', err)
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  const createCanvas = async (
    name: string,
    userId: string,
    userName?: string,
    visibility: CanvasVisibility = 'private'
  ): Promise<string> => {
    try {
      const canvasesRef = collection(firestore, 'canvases')
      const canvasName = name.trim() || generateCanvasName()

      const newCanvas = {
        name: canvasName,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: userId,
        createdByName: userName || 'Unknown',
        visibility,
        publicCanEdit: false,
        permissions: []
      }

      const docRef = await addDoc(canvasesRef, newCanvas)

      // Refresh the list
      await fetchCanvases(userId)

      return docRef.id
    } catch (err) {
      console.error('Error creating canvas:', err)
      throw err
    }
  }

  return {
    canvases,
    publicCanvases,
    loading,
    error,
    createCanvas,
    refresh: () => userId && fetchCanvases(userId)
  }
}
