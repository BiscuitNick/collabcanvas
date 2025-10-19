# RTDB Debug Guide

This guide explains how to use the RTDB toggle and logging features to verify real-time sync is working correctly.

## Debug Controls

### RTDB Toggle Switch

Located in the **Debug Widget** → **Debug Controls** section:

- **Firestore Updates**: Toggle Firestore persistence on/off
- **RTDB Updates**: Toggle RTDB real-time sync on/off
- **Group Caching**: Toggle group caching on/off

### How It Works

1. Open Debug Widget (Bug icon in top-right corner or press `D`)
2. Expand "Debug Controls" section
3. Toggle switches as needed

**Important:** Toggling RTDB will reload the page to reinitialize listeners.

## Testing RTDB Sync

### Test 1: Verify RTDB is Independent of Firestore

**Goal:** Confirm RTDB updates work even when Firestore is disabled.

**Steps:**
1. Open two browser windows/tabs to the same canvas
2. In **Window 1**:
   - Open Debug Widget
   - Disable "Firestore Updates" toggle
   - Keep "RTDB Updates" enabled
3. In **Window 2**:
   - Keep both toggles enabled
4. In **Window 1**, drag a shape
5. **Expected Behavior**:
   - Window 2 should see the shape moving in real-time
   - Window 1 console shows: `📤 [RTDB] Sending content update to RTDB`
   - Window 2 console shows: `📥 [RTDB] Received content update from RTDB`
   - No Firestore updates in Window 1
6. Refresh **Window 1**
7. **Expected Behavior**:
   - Shape position is NOT persisted (Firestore was off)
   - Shape returns to original position

### Test 2: Verify Firestore Persistence

**Goal:** Confirm Firestore persistence works after RTDB updates.

**Steps:**
1. Open two browser windows to the same canvas
2. Keep both toggles enabled in both windows
3. In **Window 1**, drag a shape and release
4. **Expected Behavior**:
   - Window 1 console shows:
     ```
     📤 [RTDB] Sending content update to RTDB (during drag)
     📤 [RTDB] Sending content update to RTDB (on drag end, immediate: true)
     ```
   - Window 2 console shows:
     ```
     📥 [RTDB] Received content update from RTDB (multiple times during drag)
     ```
   - After ~2 seconds, Firestore update logs appear
5. Refresh both windows
6. **Expected Behavior**:
   - Shape position IS persisted
   - Shape stays at new position

### Test 3: Disable RTDB Entirely

**Goal:** Confirm app still works without RTDB (Firestore-only mode).

**Steps:**
1. Open Debug Widget
2. Disable "RTDB Updates" toggle
3. Page reloads
4. Drag a shape
5. **Expected Behavior**:
   - Console shows: `🚫 [RTDB] RTDB sync disabled via localStorage`
   - No RTDB logs
   - Only Firestore update logs
   - Other users don't see real-time updates
   - Refresh shows persisted changes (via Firestore)

## Console Logging Reference

### RTDB Initialization

```
✅ [RTDB] Listening for RTDB updates on canvas: {canvasId}
✅ [RTDB Presence] Initializing presence for user: {userId}
✅ [RTDB Cursors] Listening for cursor updates
```

### RTDB Disabled

```
🚫 [RTDB] RTDB sync disabled via localStorage
🚫 [RTDB Presence] RTDB disabled via localStorage
🚫 [RTDB Cursors] RTDB disabled via localStorage
```

### Sending Updates

```
📤 [RTDB] Sending content update to RTDB: {
  itemId: "rectangle-1234567890-abc123",
  updates: { x: 100, y: 200 },
  immediate: false,
  timestamp: "2025-01-19T10:30:45.123Z"
}
```

### Receiving Updates

```
📥 [RTDB] Received content update from RTDB: {
  itemId: "rectangle-1234567890-abc123",
  updatedBy: "user123",
  data: { x: 100, y: 200 },
  timestamp: "2025-01-19T10:30:45.123Z"
}

📊 [RTDB] Applied 1 content update(s) from RTDB
```

### ContentIds (Z-Index) Updates

```
📥 [RTDB] Received contentIds update from RTDB: {
  idsCount: 5,
  updatedBy: "user123",
  timestamp: "2025-01-19T10:30:45.123Z"
}
```

### Toggle Changes

```
🔧 [FullScreenLayout] Firestore enabled
🔧 [FullScreenLayout] RTDB disabled
```

### Errors

```
❌ [RTDB] Error updating content in RTDB: {error}
```

## Verification Checklist

Use this checklist to verify RTDB is working correctly:

### Real-time Sync
- [ ] Open two browser windows to same canvas
- [ ] Drag shape in Window 1
- [ ] Window 2 sees shape moving in real-time
- [ ] Console shows `📤 [RTDB] Sending` in Window 1
- [ ] Console shows `📥 [RTDB] Received` in Window 2

### RTDB Independent of Firestore
- [ ] Disable Firestore in Window 1
- [ ] Keep RTDB enabled
- [ ] Drag shape in Window 1
- [ ] Window 2 still sees real-time updates
- [ ] Refresh Window 1
- [ ] Shape position NOT persisted (returns to original)

### Firestore Persistence
- [ ] Enable both Firestore and RTDB
- [ ] Drag and release shape
- [ ] Wait 2 seconds
- [ ] Refresh page
- [ ] Shape position IS persisted

### RTDB Disabled Mode
- [ ] Disable RTDB toggle
- [ ] Page reloads
- [ ] Console shows `🚫 [RTDB] RTDB sync disabled`
- [ ] Drag shape
- [ ] No RTDB logs in console
- [ ] Other users don't see real-time updates
- [ ] Firestore still persists changes

### Presence & Cursors
- [ ] RTDB enabled
- [ ] Open Debug Widget → Cursors section
- [ ] See other users' cursors
- [ ] Move mouse, see cursor update in other window
- [ ] Console shows presence initialization logs

### Performance
- [ ] During active dragging, RTDB updates are throttled (~60fps)
- [ ] On drag end, immediate RTDB update with `immediate: true`
- [ ] Firestore update ~2 seconds after drag ends
- [ ] No excessive console spam

## Troubleshooting

### No RTDB logs appearing

**Check:**
1. RTDB toggle is ON in Debug Widget
2. RTDB is enabled in Firebase Console
3. `VITE_FIREBASE_DATABASE_URL` is in `.env`
4. RTDB security rules are configured
5. Browser console filter is not hiding logs (search for `[RTDB]`)

### RTDB updates but Firestore doesn't persist

**Check:**
1. Firestore toggle is ON
2. Wait at least 2 seconds after editing stops
3. Check Firestore security rules
4. Look for Firestore errors in console

### Updates only work one direction

**Check:**
1. Both windows have RTDB enabled
2. Both users are authenticated
3. Canvas ID is the same in both windows
4. Check for RTDB permission errors in console

### Page reload on RTDB toggle

**This is expected behavior.** RTDB listeners are initialized on mount, so toggling requires a page reload to reinitialize them properly.

## Best Practices for Testing

1. **Use Browser Console Filters:**
   - Filter by `[RTDB]` to see only RTDB logs
   - Filter by `[Firestore]` to see only Firestore logs

2. **Test in Incognito/Private Windows:**
   - Prevents localStorage conflicts
   - Simulates different users more accurately

3. **Clear Console Between Tests:**
   - Easier to see specific test results
   - Reduces log clutter

4. **Monitor Network Tab:**
   - RTDB uses WebSocket connection
   - Look for `wss://` connections to Firebase
   - Firestore uses HTTP requests

5. **Test Offline Mode:**
   - Disable network in DevTools
   - Verify offline queue works
   - Re-enable network and verify sync

## Performance Monitoring

Watch for these metrics in console:

- **RTDB writes:** During active drag, should see ~60 updates/second max
- **Firestore writes:** Should see 1 write ~2 seconds after editing stops
- **Update batching:** Multiple rapid changes should be throttled/debounced
- **Network usage:** RTDB WebSocket should stay open, minimal reconnects

## Example Test Session

```
1. Open Debug Widget
2. Enable both Firestore and RTDB
3. Open console, filter by "[RTDB]"
4. Drag a shape slowly
5. Observe logs:
   ✅ [RTDB] Listening for RTDB updates on canvas: abc123
   📤 [RTDB] Sending content update to RTDB: {...}
   📤 [RTDB] Sending content update to RTDB: {...}
   📤 [RTDB] Sending content update to RTDB: {...}
6. Release shape
7. Observe:
   📤 [RTDB] Sending content update to RTDB: { immediate: true }
8. Wait 2 seconds
9. Observe Firestore persistence logs
10. Refresh page
11. Verify shape stayed at new position
```

Success! RTDB is working correctly.
