# Firebase RTDB Integration Guide

This document explains how to use the Firebase Realtime Database (RTDB) integration for real-time collaboration in CollabCanvas.

## Overview

The RTDB integration provides:
- **Real-time sync** during active editing (drag, typing, etc.)
- **Object locking** to prevent editing conflicts
- **Firestore persistence** after edits complete (debounced)
- **User presence** and **cursor tracking**
- **Offline mode** with local-only edits

## Architecture

### RTDB vs Firestore

| Feature | RTDB | Firestore |
|---------|------|-----------|
| **During active editing** | ✅ Updates in real-time (~60fps) | ❌ No updates |
| **After editing completes** | ✅ Immediate update | ✅ Update after 2s debounce |
| **On blur/finish events** | ✅ Immediate update | ✅ Immediate update |
| **User presence** | ✅ Exclusive | ❌ Not used |
| **User cursors** | ✅ Exclusive | ❌ Not used |
| **Object locking** | ✅ Managed here | ❌ Not used |
| **Z-index (contentIds)** | ✅ Real-time | ✅ Debounced |
| **Offline mode** | ❌ Read-only | ✅ Queue and sync |

## Quick Start

### 1. Basic Usage

Replace `useContent` with `useContentWithRTDB`:

```tsx
// Before
import { useContent } from './hooks/useContent'

const { content, updateContent } = useContent()

// After
import { useContentWithRTDB } from './hooks/useContentWithRTDB'

const { content, updateContent, updateContentComplete } = useContentWithRTDB()
```

### 2. Update During Editing (Real-time)

Use `updateContent` for changes during active editing:

```tsx
// During drag
const handleDragMove = (id: string, x: number, y: number) => {
  updateContent(id, { x, y }) // Updates RTDB in real-time
}

// During typing
const handleTextChange = (id: string, text: string) => {
  updateContent(id, { text }) // Updates RTDB in real-time
}
```

### 3. Update After Editing (Immediate Firestore Sync)

Use `updateContentComplete` for changes after editing finishes:

```tsx
// After drag ends
const handleDragEnd = (id: string, x: number, y: number) => {
  updateContentComplete(id, { x, y }) // Immediately syncs to RTDB + Firestore
}

// On input blur
const handleBlur = (id: string, text: string) => {
  updateContentComplete(id, { text }) // Immediately syncs to RTDB + Firestore
}
```

### 4. Object Locking

Acquire lock before editing to prevent conflicts:

```tsx
// Start editing
const handleEditStart = async (id: string) => {
  const lockAcquired = await startEditing(id)

  if (!lockAcquired) {
    alert('This object is being edited by another user')
    return
  }

  // Proceed with editing
}

// Stop editing
const handleEditEnd = async (id: string) => {
  await stopEditing(id) // Releases lock and flushes to Firestore
}
```

### 5. Presence and Cursors

Access real-time presence and cursor data:

```tsx
const {
  activeUsers,  // Array of active users
  cursors,      // Map of user cursors
  updateCursor, // Update current user's cursor
} = useContentWithRTDB()

// Update cursor on mouse move
const handleMouseMove = (x: number, y: number) => {
  updateCursor(x, y)
}

// Render cursors
{Array.from(cursors.values()).map(cursor => (
  <Cursor key={cursor.userId} cursor={cursor} />
))}
```

### 6. Offline Mode

The hook automatically handles offline mode:

```tsx
const {
  isOnline,           // Connection status
  queuedUpdateCount,  // Number of queued updates
  syncQueuedUpdates,  // Manually sync queue
} = useContentWithRTDB()

// Show offline indicator
{!isOnline && (
  <div className="offline-banner">
    Offline - {queuedUpdateCount} changes pending
  </div>
)}
```

## Advanced Usage

### Using Individual Hooks

For more control, use individual RTDB hooks:

```tsx
import {
  useRTDBPresence,
  useRTDBCursors,
  useRTDBLocking,
  useRTDBContentSync,
  useOfflineMode,
} from './hooks/rtdb'

// Or use the combined hook
import { useRTDBCanvas } from './hooks/rtdb/useRTDBCanvas'

const rtdb = useRTDBCanvas(canvasId, {
  enableFirestorePersistence: true,
  onLockAcquired: (itemId) => console.log('Lock acquired', itemId),
  onLockReleased: (itemId) => console.log('Lock released', itemId),
  onLockFailed: (itemId) => console.warn('Lock failed', itemId),
  onFirestoreUpdate: (content) => console.log('Firestore updated', content),
})
```

## Configuration

### RTDB Config (`src/lib/rtdb-config.ts`)

```typescript
// Presence configuration
export const PRESENCE_HEARTBEAT_INTERVAL = 5000 // 5 seconds
export const PRESENCE_OFFLINE_THRESHOLD = 15000 // 15 seconds

// Cursor configuration
export const CURSOR_THROTTLE_MS = 16 // ~60fps

// Content sync configuration
export const CONTENT_THROTTLE_MS = 16 // ~60fps
export const FIRESTORE_DEBOUNCE_MS = 2000 // 2 seconds after last change

// Lock configuration
export const LOCK_TIMEOUT_MS = 30000 // 30 seconds
export const LOCK_HEARTBEAT_INTERVAL = 5000 // 5 seconds
```

## Migration Guide

### From Firestore-only to RTDB + Firestore

1. **Install dependencies** (already included in firebase SDK)

2. **Update imports**:
```tsx
// Old
import { useContent } from './hooks/useContent'

// New
import { useContentWithRTDB } from './hooks/useContentWithRTDB'
```

3. **Update drag handlers**:
```tsx
// Old
const handleDragMove = (id, x, y) => {
  updateContent(id, { x, y })
}

const handleDragEnd = (id, x, y) => {
  updateContent(id, { x, y })
}

// New
const handleDragMove = (id, x, y) => {
  updateContent(id, { x, y }) // Real-time via RTDB
}

const handleDragEnd = (id, x, y) => {
  updateContentComplete(id, { x, y }) // Immediate Firestore sync
}
```

4. **Add locking to input handlers**:
```tsx
// New
const handleInputFocus = async (id) => {
  const lockAcquired = await startEditing(id)
  if (!lockAcquired) {
    // Show error or disable editing
  }
}

const handleInputBlur = async (id, updates) => {
  updateContentComplete(id, updates)
  await stopEditing(id)
}
```

5. **Replace presence/cursor hooks** (if using separate hooks):
```tsx
// Old
import { usePresence } from './hooks/usePresence'
import { useCursors } from './hooks/useCursors'

// New - now included in useContentWithRTDB
const { activeUsers, cursors, updateCursor } = useContentWithRTDB()
```

## RTDB Data Structure

```
canvases/
  {canvasId}/
    presence/
      {userId}: {
        userId: string
        userName: string
        color: string
        photoURL: string | null
        joinedAt: number
        lastSeen: number
      }

    cursors/
      {userId}: {
        userId: string
        userName: string
        color: string
        x: number
        y: number
        lastUpdated: number
      }

    locks/
      {itemId}: {
        userId: string
        userName: string
        color: string
        lockedAt: number
        lastHeartbeat: number
      }

    content/
      {itemId}: {
        id: string
        data: Partial<Content>
        updatedBy: string
        updatedAt: number
      }

    contentIds: {
      ids: string[]
      updatedBy: string
      updatedAt: number
    }
```

## Troubleshooting

### Cursors not showing

Check that:
1. RTDB is enabled in Firebase console
2. Database URL is in `.env` as `VITE_FIREBASE_DATABASE_URL`
3. RTDB security rules allow read/write

### Lock conflicts

If users can't edit objects:
1. Check `LOCK_TIMEOUT_MS` - stale locks auto-release after 30s
2. Verify `releaseLock()` is called when editing stops
3. Check browser console for lock errors

### Offline mode not syncing

Ensure:
1. `syncQueuedUpdates()` is called when connection restores
2. Queue size hasn't exceeded `MAX_OFFLINE_QUEUE_SIZE` (default: 1000)
3. Firestore permissions allow writes

### High RTDB usage

To reduce usage:
1. Increase `CONTENT_THROTTLE_MS` (default: 16ms)
2. Increase `CURSOR_THROTTLE_MS` (default: 16ms)
3. Increase `PRESENCE_HEARTBEAT_INTERVAL` (default: 5000ms)

## Best Practices

1. **Always use locking for text inputs** to prevent typing conflicts
2. **Use `updateContent` during active editing** for real-time sync
3. **Use `updateContentComplete` on blur/finish** for immediate Firestore persistence
4. **Release locks in cleanup** to prevent stale locks
5. **Show offline indicator** to inform users of connection status
6. **Debounce rapid updates** to reduce RTDB writes (already handled)

## Security Rules (RTDB)

Add to Firebase Realtime Database rules:

```json
{
  "rules": {
    "canvases": {
      "$canvasId": {
        ".read": "auth != null",
        ".write": "auth != null",

        "presence": {
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        },

        "cursors": {
          "$userId": {
            ".write": "$userId === auth.uid"
          }
        },

        "locks": {
          "$itemId": {
            ".write": "auth != null"
          }
        },

        "content": {
          ".write": "auth != null"
        },

        "contentIds": {
          ".write": "auth != null"
        }
      }
    }
  }
}
```

## Performance Considerations

- **RTDB writes**: ~60 writes/second during active dragging per user
- **Firestore writes**: 1 write every 2 seconds after editing stops
- **Cursor updates**: ~60 updates/second per user
- **Presence heartbeat**: 1 update every 5 seconds per user

To optimize:
- Increase throttle intervals in `rtdb-config.ts`
- Use viewport culling to limit rendered objects
- Implement lazy loading for large canvases
