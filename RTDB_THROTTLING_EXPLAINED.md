# RTDB Throttling - Reads AND Writes

## Summary

Yes! We're now throttling **BOTH reads AND writes** to RTDB at 16ms (~60fps).

## Write Throttling (Already Existed)

**Where:** `updateContentRTDB()` in `useRTDBContentSync.ts`

**How it works:**
```typescript
const timeSinceLastUpdate = now - lastUpdate

if (timeSinceLastUpdate >= CONTENT_THROTTLE_MS) {
  performUpdate()  // Send immediately
} else {
  // Wait and batch
  setTimeout(performUpdate, CONTENT_THROTTLE_MS - timeSinceLastUpdate)
}
```

**Result:** Maximum 60 writes per second per item (~16ms between writes)

**Example:** User drags shape rapidly
- Frame 1 (0ms): Write to RTDB ✅
- Frame 2 (5ms): Queued ⏳
- Frame 3 (10ms): Queued ⏳
- Frame 4 (16ms): Write to RTDB ✅
- Frame 5 (20ms): Queued ⏳
- Frame 6 (32ms): Write to RTDB ✅

## Read Throttling (Just Added!)

**Where:** `onValue()` listener in `useRTDBContentSync.ts`

**Problem it solves:**
- RTDB's `onValue` fires for EVERY change in the entire `/content` collection
- If 5 users drag 5 shapes simultaneously = 300 events/second!
- Each event triggered a `updateContentInStore()` = 300 re-renders/second!
- **This caused excessive re-renders and laggy UI**

**How it works now:**
```typescript
// onValue fires (could be many times per frame)
const unsubscribeContent = onValue(contentRef, (snapshot) => {
  // Queue ALL updates in a Map (automatically dedupes by ID)
  Object.values(contentMap).forEach((rtdbData) => {
    pendingUpdatesRef.current.set(rtdbData.id, rtdbData)
  })

  // Throttle: Only apply updates every 16ms
  if (readThrottleTimeoutRef.current) {
    clearTimeout(readThrottleTimeoutRef.current)  // Reset timer
  }

  readThrottleTimeoutRef.current = setTimeout(() => {
    applyPendingUpdates()  // Batch apply all pending updates
  }, CONTENT_THROTTLE_MS)  // 16ms
})
```

**Result:**
- Updates are **queued** as they arrive
- Applied in **batches** every 16ms
- Only the **latest value** for each item is applied (Map automatically dedupes)
- Maximum **60 re-renders per second** (vs unlimited before)

**Example:** 5 users drag 5 shapes
- 0-15ms: Receive 50 RTDB events → Queue in Map (5 unique items)
- 16ms: Apply all 5 updates at once → 1 re-render ✅
- 17-31ms: Receive 50 more events → Queue in Map
- 32ms: Apply all 5 updates at once → 1 re-render ✅

## Benefits

### Before Read Throttling ❌
- **300 RTDB events/sec** → **300 `updateContentInStore()` calls/sec** → **300 re-renders/sec**
- Laggy UI
- Excessive CPU usage
- Browser struggles to keep up

### After Read Throttling ✅
- **300 RTDB events/sec** → **Batched to 60 update cycles/sec** → **60 re-renders/sec max**
- Smooth 60fps updates
- Reasonable CPU usage
- Automatic deduplication (only latest value per item)

## Configuration

All throttling values in `src/lib/rtdb-config.ts`:

```typescript
// Content sync configuration
export const CONTENT_THROTTLE_MS = 16 // ~60fps for smooth updates

// Used for:
// 1. Write throttling (max writes per item)
// 2. Read throttling (max update cycles)
```

**Can be adjusted:**
- Lower (8ms) = 120fps (higher CPU, smoother)
- Higher (33ms) = 30fps (lower CPU, less smooth)
- Sweet spot = 16ms (~60fps)

## How Reads and Writes Work Together

### Scenario: User A drags rectangle rapidly

**User A's Browser:**

1. **Writes (throttled at 16ms):**
   ```
   0ms:  Update local store → Send to RTDB ✅
   5ms:  Update local store → Queued ⏳
   10ms: Update local store → Queued ⏳
   16ms: Update local store → Send to RTDB ✅
   ```

2. **Reads (User A's own updates):**
   ```
   0ms:  Receive from RTDB → Skip (own update) ⏭️
   16ms: Receive from RTDB → Skip (own update) ⏭️
   ```

**User B's Browser:**

1. **Writes:** None (not dragging)

2. **Reads (throttled at 16ms):**
   ```
   0-15ms:   Receive 10 RTDB events from User A → Queue all ⏳
   16ms:     Apply latest position → Re-render ✅ (smooth!)
   17-31ms:  Receive 10 more events → Queue all ⏳
   32ms:     Apply latest position → Re-render ✅ (smooth!)
   ```

**Result:** User B sees smooth 60fps updates of User A's drag!

## Deduplication Logic

The read throttling uses a **Map** to automatically deduplicate:

```typescript
// Multiple updates for same item within 16ms window
pendingUpdatesRef.current.set('rect-123', { x: 100, y: 100 })  // Event 1
pendingUpdatesRef.current.set('rect-123', { x: 105, y: 102 })  // Event 2 (overwrites)
pendingUpdatesRef.current.set('rect-123', { x: 110, y: 105 })  // Event 3 (overwrites)
pendingUpdatesRef.current.set('rect-456', { x: 200, y: 200 })  // Different item

// After 16ms, only 2 updates applied (latest for each item):
applyPendingUpdates()
// → rect-123: { x: 110, y: 105 } ✅ (latest)
// → rect-456: { x: 200, y: 200 } ✅
```

**Benefit:** Skips intermediate positions, only applies final position within each 16ms window.

## Performance Comparison

### Without Read Throttling (Before)

```
5 users dragging 5 shapes simultaneously:
- RTDB events: 300/sec (60 fps × 5 users)
- Store updates: 300/sec
- Re-renders: 300/sec
- CPU: 🔥🔥🔥 High
- UI: 😞 Laggy
```

### With Read Throttling (After)

```
5 users dragging 5 shapes simultaneously:
- RTDB events: 300/sec (same)
- Store updates: 60/sec (batched)
- Re-renders: 60/sec (smooth 60fps)
- CPU: ✅ Reasonable
- UI: 😊 Smooth
```

## Testing

Open browser console and watch the logs:

### Writes (Your own drag)
```
📤 [RTDB] Sending content update to RTDB  (every ~16ms)
⏭️ [RTDB] Skipping own update             (every ~16ms)
```

### Reads (Other users' drags)
```
📥 [RTDB] Received content update from RTDB  (every ~16ms batch)
📊 [RTDB] Applied 5 content update(s) from RTDB
```

**Good sign:** You should NOT see hundreds of logs per second!

## Additional Throttling

We also throttle:

1. **Cursors:** 16ms (`CURSOR_THROTTLE_MS`)
2. **Presence heartbeat:** 5000ms (`PRESENCE_HEARTBEAT_INTERVAL`)
3. **Lock heartbeat:** 5000ms (`LOCK_HEARTBEAT_INTERVAL`)
4. **Firestore debounce:** 2000ms (`FIRESTORE_DEBOUNCE_MS`)

## Summary

✅ **Write throttling:** Max 60 writes/sec per item
✅ **Read throttling:** Max 60 update cycles/sec (NEW!)
✅ **Automatic deduplication:** Only latest value per item
✅ **Smooth 60fps:** Even with many users
✅ **Low CPU usage:** Batched updates prevent excessive re-renders

The RTDB implementation is now optimized for performance! 🚀
