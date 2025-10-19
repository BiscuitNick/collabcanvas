import { useEffect, useRef, useCallback } from 'react'
import { ref, set, onValue, remove } from 'firebase/database'
import { database } from '../../lib/firebase'
import { getRTDBPaths, CONTENT_THROTTLE_MS, FIRESTORE_DEBOUNCE_MS } from '../../lib/rtdb-config'
import { useCanvasStore } from '../../store/canvasStore'
import { useAuth } from '../useAuth'
import { useContentOperations } from '../firestore/useContentOperations'
import type { Content } from '../../types'

interface RTDBContentData {
  id: string
  data: Partial<Content>
  updatedBy: string
  updatedAt: number
}

interface SyncOptions {
  /** Enable Firestore persistence (debounced after changes complete) */
  enableFirestorePersistence?: boolean
  /** Callback when Firestore update is triggered */
  onFirestoreUpdate?: (content: Content) => void
}

export const useRTDBContentSync = (
  canvasId: string | null,
  options: SyncOptions = {}
) => {
  const { enableFirestorePersistence = true, onFirestoreUpdate } = options

  const { user } = useAuth()
  const { updateContent: updateContentInStore, setContentIds } = useCanvasStore()
  const { updateContent: updateContentInFirestore } = useContentOperations(
    [],
    () => {},
    { current: new Set() },
    { current: false },
    user?.uid,
    async () => {},
    async () => {}
  )

  // Track throttling for RTDB updates
  const lastRTDBUpdateRef = useRef<Map<string, number>>(new Map())
  const throttleTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Track debouncing for Firestore updates
  const firestoreDebounceTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const activeEditingRef = useRef<Set<string>>(new Set())

  // Track throttling for RTDB reads
  const readThrottleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingUpdatesRef = useRef<Map<string, RTDBContentData>>(new Map())

  /**
   * Update content in RTDB (real-time sync)
   */
  const updateContentRTDB = useCallback(
    (itemId: string, updates: Partial<Content>, immediate = false) => {
      if (!canvasId || !user) return

      // Check if RTDB is enabled (via localStorage)
      const enableRTDB = localStorage.getItem('enableRTDB')
      if (enableRTDB === 'false') {
        // RTDB disabled - just update local store
        updateContentInStore(itemId, updates)
        return
      }

      const now = Date.now()
      const lastUpdate = lastRTDBUpdateRef.current.get(itemId) || 0
      const timeSinceLastUpdate = now - lastUpdate

      const performUpdate = async () => {
        // IMPORTANT: Update local store FIRST to prevent snapback
        const updatesWithMetadata = {
          ...updates,
          lastEditedBy: user.uid,
          lastEditedAt: Date.now(),
          updatedAt: Date.now(),
        }

        updateContentInStore(itemId, updatesWithMetadata)

        // Mark as actively editing
        activeEditingRef.current.add(itemId)

        // Then send to RTDB
        const paths = getRTDBPaths(canvasId)
        const contentRef = ref(database, paths.contentItem(itemId))

        const rtdbData: RTDBContentData = {
          id: itemId,
          data: updatesWithMetadata,
          updatedBy: user.uid,
          updatedAt: Date.now(),
        }

        try {
          await set(contentRef, rtdbData)
          lastRTDBUpdateRef.current.set(itemId, Date.now())

          // Schedule Firestore update (debounced)
          if (enableFirestorePersistence) {
            scheduleFirestoreUpdate(itemId, updates)
          }
        } catch (error) {
        }
      }

      // Immediate update (e.g., on drag end, blur)
      if (immediate) {
        performUpdate()
        // Also immediately flush to Firestore when immediate flag is set
        if (enableFirestorePersistence) {
          // Clear any existing debounce
          const existingTimeout = firestoreDebounceTimeoutsRef.current.get(itemId)
          if (existingTimeout) {
            clearTimeout(existingTimeout)
            firestoreDebounceTimeoutsRef.current.delete(itemId)
          }

          // Flush immediately
          const content = useCanvasStore.getState().content.find((c) => c.id === itemId)
          if (content) {
            updateContentInFirestore(itemId, updates).then(() => {
              onFirestoreUpdate?.(content)
            }).catch(() => {
              // Silently fail
            })
          }
        }
        return
      }

      // Throttled update (e.g., during drag, typing)
      if (timeSinceLastUpdate >= CONTENT_THROTTLE_MS) {
        performUpdate()
      } else {
        // Clear existing timeout and schedule new one
        const existingTimeout = throttleTimeoutsRef.current.get(itemId)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        const timeout = setTimeout(
          performUpdate,
          CONTENT_THROTTLE_MS - timeSinceLastUpdate
        )
        throttleTimeoutsRef.current.set(itemId, timeout)
      }
    },
    [canvasId, user, updateContentInStore, enableFirestorePersistence]
  )

  /**
   * Schedule a debounced Firestore update
   */
  const scheduleFirestoreUpdate = useCallback(
    (itemId: string, updates: Partial<Content>) => {
      // Check if Firestore is enabled
      const enableFirestore = localStorage.getItem('enableFirestore')
      if (enableFirestore === 'false') {
        return
      }

      // Clear existing timeout
      const existingTimeout = firestoreDebounceTimeoutsRef.current.get(itemId)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
      }

      // Schedule new debounced update
      const timeout = setTimeout(async () => {
        // Mark as no longer actively editing
        activeEditingRef.current.delete(itemId)

        // Get the full content from store
        const content = useCanvasStore.getState().content.find((c) => c.id === itemId)
        if (!content) return

        try {
          await updateContentInFirestore(itemId, updates)
          onFirestoreUpdate?.(content)
        } catch (error) {
        }

        firestoreDebounceTimeoutsRef.current.delete(itemId)
      }, FIRESTORE_DEBOUNCE_MS)

      firestoreDebounceTimeoutsRef.current.set(itemId, timeout)
    },
    [updateContentInFirestore, onFirestoreUpdate]
  )

  /**
   * Immediately flush pending Firestore update for an item (e.g., on blur)
   */
  const flushFirestoreUpdate = useCallback(
    async (itemId: string) => {
      // Clear debounce timeout
      const timeout = firestoreDebounceTimeoutsRef.current.get(itemId)
      if (timeout) {
        clearTimeout(timeout)
        firestoreDebounceTimeoutsRef.current.delete(itemId)
      }

      // Mark as no longer actively editing
      activeEditingRef.current.delete(itemId)

      // Get the full content from store
      const content = useCanvasStore.getState().content.find((c) => c.id === itemId)
      if (!content) return

      try {
        await updateContentInFirestore(itemId, content)
        onFirestoreUpdate?.(content)
      } catch (error) {
      }
    },
    [updateContentInFirestore, onFirestoreUpdate]
  )

  /**
   * Update contentIds (z-index) in RTDB
   */
  const updateContentIdsRTDB = useCallback(
    async (contentIds: string[]) => {
      if (!canvasId || !user) return

      const paths = getRTDBPaths(canvasId)
      const contentIdsRef = ref(database, paths.contentIds)

      try {
        await set(contentIdsRef, {
          ids: contentIds,
          updatedBy: user.uid,
          updatedAt: Date.now(),
        })

        // Also update local store
        setContentIds(contentIds)

        // Schedule Firestore update (debounced)
        if (enableFirestorePersistence) {
          const existingTimeout = firestoreDebounceTimeoutsRef.current.get('contentIds')
          if (existingTimeout) {
            clearTimeout(existingTimeout)
          }

          const timeout = setTimeout(async () => {
            // Update Firestore with new contentIds
            // This will be handled by the Firestore sync hook
            firestoreDebounceTimeoutsRef.current.delete('contentIds')
          }, FIRESTORE_DEBOUNCE_MS)

          firestoreDebounceTimeoutsRef.current.set('contentIds', timeout)
        }
      } catch (error) {
      }
    },
    [canvasId, user, setContentIds, enableFirestorePersistence]
  )

  /**
   * Remove content from RTDB
   */
  const removeContentRTDB = useCallback(
    async (itemId: string) => {
      if (!canvasId) return

      const paths = getRTDBPaths(canvasId)
      const contentRef = ref(database, paths.contentItem(itemId))

      try {
        await remove(contentRef)

        // Clear any pending timeouts
        const throttleTimeout = throttleTimeoutsRef.current.get(itemId)
        if (throttleTimeout) {
          clearTimeout(throttleTimeout)
          throttleTimeoutsRef.current.delete(itemId)
        }

        const debounceTimeout = firestoreDebounceTimeoutsRef.current.get(itemId)
        if (debounceTimeout) {
          clearTimeout(debounceTimeout)
          firestoreDebounceTimeoutsRef.current.delete(itemId)
        }

        activeEditingRef.current.delete(itemId)
      } catch (error) {
      }
    },
    [canvasId]
  )

  /**
   * Listen for RTDB content updates and locks
   */
  useEffect(() => {
    if (!canvasId || !user) return

    // Check if RTDB is enabled (via localStorage)
    const enableRTDB = localStorage.getItem('enableRTDB')
    if (enableRTDB === 'false') {
      return
    }

    const paths = getRTDBPaths(canvasId)
    const contentRef = ref(database, paths.content)
    const contentIdsRef = ref(database, paths.contentIds)

    // Process and apply pending updates (throttled)
    const applyPendingUpdates = () => {
      if (pendingUpdatesRef.current.size === 0) return

      let updatesReceived = 0
      const currentStoreContent = useCanvasStore.getState().content

      pendingUpdatesRef.current.forEach((rtdbData) => {
        // Skip updates from current user (already applied locally)
        if (rtdbData.updatedBy === user.uid) {
          return
        }

        // Skip if actively editing this item
        if (activeEditingRef.current.has(rtdbData.id)) {
          return
        }

        // Check if this item exists and was last edited by current user
        const existingItem = currentStoreContent.find(c => c.id === rtdbData.id)
        if (existingItem && existingItem.lastEditedBy === user.uid) {
          return
        }

        // Apply remote updates to local store
        updateContentInStore(rtdbData.id, rtdbData.data)
        updatesReceived++
      })

      // Clear pending updates
      pendingUpdatesRef.current.clear()
    }

    // Listen for content changes
    const unsubscribeContent = onValue(contentRef, (snapshot) => {
      const contentMap = snapshot.val() as Record<string, RTDBContentData> | null
      if (!contentMap) return

      // Queue all updates
      Object.values(contentMap).forEach((rtdbData) => {
        pendingUpdatesRef.current.set(rtdbData.id, rtdbData)
      })

      // Throttle applying updates to prevent excessive re-renders
      if (readThrottleTimeoutRef.current) {
        clearTimeout(readThrottleTimeoutRef.current)
      }

      readThrottleTimeoutRef.current = setTimeout(() => {
        applyPendingUpdates()
        readThrottleTimeoutRef.current = null
      }, CONTENT_THROTTLE_MS)
    })

    // Listen for contentIds changes
    const unsubscribeContentIds = onValue(contentIdsRef, (snapshot) => {
      const data = snapshot.val() as {
        ids: string[]
        updatedBy: string
        updatedAt: number
      } | null

      if (!data) return

      // Skip updates from current user
      if (data.updatedBy === user.uid) return

      // Apply remote contentIds to local store
      setContentIds(data.ids)
    })

    // Cleanup on unmount
    return () => {
      unsubscribeContent()
      unsubscribeContentIds()

      // Clear all timeouts
      throttleTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      throttleTimeoutsRef.current.clear()

      firestoreDebounceTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout))
      firestoreDebounceTimeoutsRef.current.clear()

      if (readThrottleTimeoutRef.current) {
        clearTimeout(readThrottleTimeoutRef.current)
      }
    }
  }, [canvasId, user, updateContentInStore, setContentIds])

  return {
    updateContentRTDB,
    updateContentIdsRTDB,
    removeContentRTDB,
    flushFirestoreUpdate,
  }
}
