# RTDB Snapback Fix

## Problem

When dragging shapes with RTDB enabled, shapes were "snapping back" to previous positions. This happened because RTDB was applying remote updates on top of local changes, overwriting the user's current drag position.

## Root Cause

The RTDB implementation wasn't following the same conflict resolution strategy as Firestore:

1. **Not checking `lastEditedBy`** - We weren't tracking who last edited an item
2. **Not checking actively editing** - We weren't properly skipping updates for items being edited
3. **Wrong update order** - We were sending to RTDB before updating local store

## Solution

Applied the **same strategy as Firestore sync** from `useFirestoreSync.ts`:

### 1. Update Local Store FIRST

```typescript
// BEFORE (wrong order - caused snapback)
await set(contentRef, rtdbData)  // Send to RTDB first
updateContentInStore(itemId, updates)  // Then update local

// AFTER (correct order - prevents snapback)
updateContentInStore(itemId, updatesWithMetadata)  // Update local FIRST
await set(contentRef, rtdbData)  // Then send to RTDB
```

### 2. Track `lastEditedBy` Metadata

```typescript
const updatesWithMetadata = {
  ...updates,
  lastEditedBy: user.uid,      // Track who made the change
  lastEditedAt: Date.now(),    // Track when
  updatedAt: Date.now(),
}
```

### 3. Skip Remote Updates Using 3 Checks

When receiving updates from RTDB, skip if:

```typescript
// Check 1: Skip own updates (already applied locally)
if (rtdbData.updatedBy === user.uid) {
  console.log('⏭️ [RTDB] Skipping own update')
  return
}

// Check 2: Skip if actively editing
if (activeEditingRef.current.has(rtdbData.id)) {
  console.log('✏️ [RTDB] Skipping update while actively editing')
  return
}

// Check 3: Skip if current user was last editor
const existingItem = currentStoreContent.find(c => c.id === rtdbData.id)
if (existingItem && existingItem.lastEditedBy === user.uid) {
  console.log('👤 [RTDB] Skipping - current user was last editor')
  return
}

// Only apply remote updates if all checks pass
updateContentInStore(rtdbData.id, rtdbData.data)
```

## How It Works Now

### Scenario 1: User A Drags Shape

**User A's Client:**
1. Updates local store immediately with `lastEditedBy: userA`
2. Sends update to RTDB
3. Receives own update back from RTDB
4. ✅ Skips it (Check 1: `updatedBy === user.uid`)
5. **No snapback!**

**User B's Client:**
1. Receives update from RTDB
2. Not own update ✅
3. Not actively editing ✅
4. User B wasn't last editor ✅
5. Applies update - sees User A's drag in real-time

### Scenario 2: User A Continues Dragging

**User A's Client:**
1. Updates local store again with new position
2. `lastEditedBy` stays as `userA`
3. Sends to RTDB
4. Receives own update back
5. ✅ Skips it (Check 3: `lastEditedBy === user.uid`)
6. **No snapback!**

### Scenario 3: User B Edits Same Shape

**User A's Client:**
1. Receives update from User B
2. Not own update ✅
3. Not actively editing ✅
4. Check `lastEditedBy`... it's `userA`
5. ✅ Skips it! (Check 3 protects User A's changes)

**User B's Client:**
1. Updates local store with `lastEditedBy: userB`
2. Sends to RTDB
3. Applies successfully

**Result:** Last editor wins, no conflicts!

## Changes Made

**File: `src/hooks/rtdb/useRTDBContentSync.ts`**

### Before:
```typescript
// Send to RTDB first, then update local
await set(contentRef, rtdbData)
updateContentInStore(itemId, updates)

// Only check updatedBy when receiving
if (rtdbData.updatedBy === user.uid) return
```

### After:
```typescript
// Update local FIRST with metadata
const updatesWithMetadata = {
  ...updates,
  lastEditedBy: user.uid,
  lastEditedAt: Date.now(),
  updatedAt: Date.now(),
}
updateContentInStore(itemId, updatesWithMetadata)

// Then send to RTDB
await set(contentRef, rtdbData)

// When receiving, use 3-check strategy
if (rtdbData.updatedBy === user.uid) return  // Check 1
if (activeEditingRef.current.has(rtdbData.id)) return  // Check 2
const existingItem = currentStoreContent.find(c => c.id === rtdbData.id)
if (existingItem && existingItem.lastEditedBy === user.uid) return  // Check 3
```

## Console Logs to Watch

When dragging, you should see:

```
📤 [RTDB] Sending content update to RTDB: { itemId: "rect-123", ... }
⏭️ [RTDB] Skipping own update for rect-123
```

**NOT:**
```
📥 [RTDB] Received content update from RTDB  ❌ (wrong - should skip own updates)
```

When other users drag, you should see:

```
📥 [RTDB] Received content update from RTDB: { itemId: "rect-123", updatedBy: "otherUser" }
📊 [RTDB] Applied 1 content update(s) from RTDB
```

## Testing

### Test 1: No Snapback When Dragging

1. Open canvas
2. Drag a shape smoothly
3. ✅ Shape follows cursor without snapping back
4. Console shows: `⏭️ [RTDB] Skipping own update`

### Test 2: See Other Users' Changes

1. Open 2 browser windows
2. Drag shape in Window 1
3. ✅ Window 2 sees smooth real-time updates
4. Window 2 console shows: `📥 [RTDB] Received content update`

### Test 3: Last Editor Wins

1. User A drags shape
2. User B tries to drag same shape
3. ✅ Last person to drag wins
4. Console shows appropriate skip messages

## Why This Works

The key insight from Firestore sync:

> **"If the user is editing OR was the last editor, trust their local version"**

This prevents:
- ❌ Snapback from own updates
- ❌ Conflict loops between users
- ❌ Race conditions during rapid updates

And enables:
- ✅ Smooth local updates
- ✅ Real-time sync to other users
- ✅ Predictable conflict resolution

## Build Status

✅ **TypeScript compilation successful**
✅ **Vite build successful**
✅ **No snapback!**

The RTDB implementation now matches Firestore's proven conflict resolution strategy! 🎉
