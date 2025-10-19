import { useCallback } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore'
import { firestore } from '../../lib/firebase'

export const useContentOrdering = (canvasId: string) => {
  // Add content ID to the end of contentIds array (on top)
  const addToContentIds = useCallback(async (contentId: string) => {
    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)

      if (!canvasDoc.exists()) {
        // Initialize canvas document if it doesn't exist
        await setDoc(canvasRef, { contentIds: [contentId] }, { merge: true })
      } else {
        const data = canvasDoc.data()
        if (!data.contentIds) {
          // Initialize contentIds field if it doesn't exist
          await updateDoc(canvasRef, { contentIds: [contentId] })
        } else {
          // Add to existing array
          await updateDoc(canvasRef, { contentIds: arrayUnion(contentId) })
        }
      }
      console.log('✅ [Z-INDEX] Added to contentIds:', contentId)
    } catch (err) {
      console.error('❌ [Z-INDEX] Error adding to contentIds:', err)
    }
  }, [canvasId])

  // Remove content ID from contentIds array
  const removeFromContentIds = useCallback(async (contentId: string) => {
    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)

      if (!canvasDoc.exists()) {
        console.warn('⚠️ [Z-INDEX] Canvas document does not exist, cannot remove from contentIds')
        return
      }

      const data = canvasDoc.data()
      if (!data.contentIds) {
        console.warn('⚠️ [Z-INDEX] contentIds field does not exist')
        return
      }

      await updateDoc(canvasRef, { contentIds: arrayRemove(contentId) })
      console.log('✅ [Z-INDEX] Removed from contentIds:', contentId)
    } catch (err) {
      console.error('❌ [Z-INDEX] Error removing from contentIds:', err)
    }
  }, [canvasId])

  // Bring content to front (move to end of array)
  const bringToFront = useCallback(async (contentId: string) => {
    try {
      console.log('🔼 [Z-INDEX] Bringing to front:', contentId)
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)

      if (!canvasDoc.exists()) {
        console.error('❌ [Z-INDEX] Canvas document does not exist:', canvasId)
        return
      }

      const data = canvasDoc.data()
      const contentIds = data?.contentIds || []
      console.log('📋 [Z-INDEX] Current contentIds:', contentIds)

      // Remove and add to end
      const newContentIds = contentIds.filter((id: string) => id !== contentId)
      newContentIds.push(contentId)
      console.log('📋 [Z-INDEX] New contentIds:', newContentIds)

      await updateDoc(canvasRef, { contentIds: newContentIds })
      console.log('✅ [Z-INDEX] Brought to front successfully')
    } catch (err) {
      console.error('❌ [Z-INDEX] Error bringing to front:', err)
    }
  }, [canvasId])

  // Send content to back (move to beginning of array)
  const sendToBack = useCallback(async (contentId: string) => {
    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)
      const data = canvasDoc.data()
      const contentIds = data?.contentIds || []

      // Remove and add to beginning
      const newContentIds = contentIds.filter((id: string) => id !== contentId)
      newContentIds.unshift(contentId)

      await updateDoc(canvasRef, { contentIds: newContentIds })
    } catch (err) {
      console.error('Error sending to back:', err)
    }
  }, [canvasId])

  // Move content up one layer (swap with next item)
  const moveUp = useCallback(async (contentId: string) => {
    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)
      const data = canvasDoc.data()
      const contentIds = data?.contentIds || []

      const index = contentIds.indexOf(contentId)
      if (index === -1 || index === contentIds.length - 1) return // Already at top or not found

      // Swap with next item
      const newContentIds = [...contentIds]
      ;[newContentIds[index], newContentIds[index + 1]] = [newContentIds[index + 1], newContentIds[index]]

      await updateDoc(canvasRef, { contentIds: newContentIds })
    } catch (err) {
      console.error('Error moving up:', err)
    }
  }, [canvasId])

  // Move content down one layer (swap with previous item)
  const moveDown = useCallback(async (contentId: string) => {
    try {
      const canvasRef = doc(firestore, 'canvases', canvasId)
      const canvasDoc = await getDoc(canvasRef)
      const data = canvasDoc.data()
      const contentIds = data?.contentIds || []

      const index = contentIds.indexOf(contentId)
      if (index === -1 || index === 0) return // Already at bottom or not found

      // Swap with previous item
      const newContentIds = [...contentIds]
      ;[newContentIds[index], newContentIds[index - 1]] = [newContentIds[index - 1], newContentIds[index]]

      await updateDoc(canvasRef, { contentIds: newContentIds })
    } catch (err) {
      console.error('Error moving down:', err)
    }
  }, [canvasId])

  return {
    addToContentIds,
    removeFromContentIds,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown
  }
}
