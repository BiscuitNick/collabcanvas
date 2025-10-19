/**
 * Firebase Realtime Database Configuration
 *
 * RTDB is used for real-time collaboration features:
 * - User presence and cursors
 * - Real-time object updates during active editing
 * - Object locking to prevent conflicts
 *
 * Firestore is used for persistence:
 * - Final state after edits complete
 * - Debounced updates after inactivity
 * - Updates on blur/finish events
 */

// Presence configuration
export const PRESENCE_HEARTBEAT_INTERVAL = 5000 // 5 seconds - more frequent than Firestore
export const PRESENCE_OFFLINE_THRESHOLD = 15000 // 15 seconds
export const PRESENCE_CLEANUP_INTERVAL = 30000 // 30 seconds

// Cursor configuration
export const CURSOR_THROTTLE_MS = 16 // ~60fps
export const CURSOR_STALE_THRESHOLD = 5000 // 5 seconds

// Content sync configuration
export const CONTENT_THROTTLE_MS = 1 // Minimal throttle for maximum real-time sync
export const FIRESTORE_DEBOUNCE_MS = 2000 // 2 seconds after last change before Firestore update

// Lock configuration
export const LOCK_TIMEOUT_MS = 30000 // 30 seconds - auto-release stale locks
export const LOCK_HEARTBEAT_INTERVAL = 5000 // 5 seconds - keep lock alive

// Offline mode configuration
export const OFFLINE_RETRY_DELAY = 5000 // 5 seconds between retry attempts
export const MAX_OFFLINE_QUEUE_SIZE = 1000 // Maximum number of queued changes

// RTDB paths
export const getRTDBPaths = (canvasId: string, userId?: string) => ({
  // Presence
  presence: `canvases/${canvasId}/presence`,
  userPresence: userId ? `canvases/${canvasId}/presence/${userId}` : '',

  // Cursors
  cursors: `canvases/${canvasId}/cursors`,
  userCursor: userId ? `canvases/${canvasId}/cursors/${userId}` : '',

  // Content
  content: `canvases/${canvasId}/content`,
  contentItem: (itemId: string) => `canvases/${canvasId}/content/${itemId}`,

  // Locks
  locks: `canvases/${canvasId}/locks`,
  itemLock: (itemId: string) => `canvases/${canvasId}/locks/${itemId}`,

  // Content ordering (z-index)
  contentIds: `canvases/${canvasId}/contentIds`,
})
