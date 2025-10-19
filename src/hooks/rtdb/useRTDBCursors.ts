import { useEffect, useRef, useCallback, useState } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, CURSOR_THROTTLE_MS, CURSOR_STALE_THRESHOLD } from '../../lib/rtdb-config'
import { useAuth } from '../useAuth'

interface RTDBCursorData {
  userId: string
  userName: string
  color: string
  x: number
  y: number
  lastUpdated: number
}

interface CursorPosition {
  userId: string
  userName: string
  color: string
  x: number
  y: number
}

export const useRTDBCursors = (canvasId: string | null) => {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map())
  const { user } = useAuth()
  const lastUpdateRef = useRef(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Update current user's cursor position
  const updateCursor = useCallback(
    (x: number, y: number) => {
      if (!canvasId || !user) return

      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateRef.current

      const performUpdate = async () => {
        const paths = getRTDBPaths(canvasId, user.uid)
        const cursorRef = ref(database, paths.userCursor)

        const cursorData: RTDBCursorData = {
          userId: user.uid,
          userName: user.displayName || 'Anonymous',
          color: '#' + Math.floor(Math.random()*16777215).toString(16),
          x,
          y,
          lastUpdated: Date.now(),
        }

        try {
          await set(cursorRef, cursorData)
          lastUpdateRef.current = Date.now()
        } catch (error) {
          console.error('Error updating cursor:', error)
        }
      }

      // Throttle cursor updates
      if (timeSinceLastUpdate >= CURSOR_THROTTLE_MS) {
        performUpdate()
      } else {
        if (throttleTimeoutRef.current) {
          clearTimeout(throttleTimeoutRef.current)
        }
        throttleTimeoutRef.current = setTimeout(
          performUpdate,
          CURSOR_THROTTLE_MS - timeSinceLastUpdate
        )
      }
    },
    [canvasId, user]
  )

  // Remove current user's cursor
  const removeCursor = useCallback(() => {
    if (!canvasId || !user) return

    const paths = getRTDBPaths(canvasId, user.uid)
    const cursorRef = ref(database, paths.userCursor)
    remove(cursorRef)
  }, [canvasId, user])

  // Listen for all cursors
  useEffect(() => {
    if (!canvasId || !user) return

    // Check if RTDB is enabled (via localStorage)
    const enableRTDB = localStorage.getItem('enableRTDB')
    if (enableRTDB === 'false') {
      console.log('🚫 [RTDB Cursors] RTDB disabled via localStorage')
      return
    }

    console.log('✅ [RTDB Cursors] Listening for cursor updates')

    const paths = getRTDBPaths(canvasId)
    const cursorsRef = ref(database, paths.cursors)

    const unsubscribe = onValue(cursorsRef, (snapshot) => {
      const cursorsMap = snapshot.val() as Record<string, RTDBCursorData> | null
      if (!cursorsMap) {
        setCursors(new Map())
        return
      }

      const now = Date.now()
      const newCursors = new Map<string, CursorPosition>()

      Object.entries(cursorsMap).forEach(([userId, cursorData]) => {
        // Skip current user's cursor and stale cursors
        if (userId === user.uid) return
        if (now - cursorData.lastUpdated > CURSOR_STALE_THRESHOLD) return

        newCursors.set(userId, {
          userId: cursorData.userId,
          userName: cursorData.userName,
          color: cursorData.color,
          x: cursorData.x,
          y: cursorData.y,
        })
      })

      setCursors(newCursors)
    })

    // Cleanup on unmount
    return () => {
      unsubscribe()
      removeCursor()
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }
    }
  }, [canvasId, user, removeCursor])

  return {
    cursors,
    updateCursor,
    removeCursor,
  }
}
