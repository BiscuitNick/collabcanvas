import React from 'react';
import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useContentOperations } from './firestore/useContentOperations';
import { useContentLocking } from './firestore/useContentLocking';
import { useContentOrdering } from './firestore/useContentOrdering';
import { useCanvasStore } from '../store/canvasStore';
import { useCanvasId } from '../contexts/CanvasContext';
import { useRTDBContentSync } from './rtdb/useRTDBContentSync';
import { useRTDBLocking } from './rtdb/useRTDBLocking';
import type { Content } from '../types';

export const useContent = () => {
  const { user } = useAuth();
  const canvasId = useCanvasId();
  const { content: firestoreContent, setContent, loading, error, activelyEditingRef, isCreatingContent } = useFirestoreSync(user?.uid);

  // Get z-index operations from canvas store
  const storeAddToContentIds = useCanvasStore((state) => state.addToContentIds);
  const storeRemoveFromContentIds = useCanvasStore((state) => state.removeFromContentIds);
  const storeBringToFront = useCanvasStore((state) => state.bringToFront);
  const storeSendToBack = useCanvasStore((state) => state.sendToBack);
  const storeMoveUp = useCanvasStore((state) => state.moveUp);
  const storeMoveDown = useCanvasStore((state) => state.moveDown);

  // Initialize RTDB sync for real-time updates (MUST be before we use it)
  const {
    updateContentRTDB,
    updateContentIdsRTDB,
    removeContentRTDB,
    flushFirestoreUpdate,
  } = useRTDBContentSync(canvasId, {
    enableFirestorePersistence: true,
  });

  // Initialize RTDB locking for selection-based locks
  const {
    setSelection: setSelectionRTDB,
    acquireLock: acquireLockRTDB,
    releaseLock: releaseLockRTDB,
  } = useRTDBLocking(canvasId);

  // Get Firestore ordering operations (for syncing to Firestore when enabled)
  const {
    addToContentIds: fsAddToContentIds,
    removeFromContentIds: fsRemoveFromContentIds,
    bringToFront: fsBringToFront,
    sendToBack: fsSendToBack,
    moveUp: fsMoveUp,
    moveDown: fsMoveDown
  } = useContentOrdering(
    canvasId,
    user?.uid
  );

  // Wrapper functions that update store first, then sync to RTDB and Firestore
  const addToContentIds = async (id: string) => {
    storeAddToContentIds(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsAddToContentIds(id); // Sync to Firestore
  };

  const removeFromContentIds = async (id: string) => {
    storeRemoveFromContentIds(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsRemoveFromContentIds(id); // Sync to Firestore
  };

  const bringToFront = (id: string) => {
    storeBringToFront(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsBringToFront(id); // Sync to Firestore
  };

  const sendToBack = (id: string) => {
    storeSendToBack(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsSendToBack(id); // Sync to Firestore
  };

  const moveUp = (id: string) => {
    storeMoveUp(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsMoveUp(id); // Sync to Firestore
  };

  const moveDown = (id: string) => {
    storeMoveDown(id);
    const newIds = [...useCanvasStore.getState().contentIds];
    updateContentIdsRTDB(newIds); // Sync to RTDB
    fsMoveDown(id); // Sync to Firestore
  };

  // Pass addToContentIds and removeFromContentIds to content operations
  const {
    createContent: createContentFS,
    updateContent: updateContentFS,
    deleteContent: deleteContentFS,
    clearAllContent,
    startEditingContent,
    stopEditingContent,
    createContentBatch,
    updateContentBatch,
    deleteContentBatch
  } = useContentOperations(
    firestoreContent,
    setContent,
    activelyEditingRef,
    isCreatingContent,
    user?.uid,
    addToContentIds,      // Pass this so it can be called with the real Firestore ID
    removeFromContentIds  // Pass this so it can be called when content is deleted
  );

  // Wrap updateContent to use RTDB for real-time sync
  const updateContent = React.useCallback(async (id: string, updates: Partial<Content>, immediate = false) => {
    // Check if RTDB is enabled
    const enableRTDB = localStorage.getItem('enableRTDB');

    if (enableRTDB !== 'false') {
      // RTDB enabled: Update via RTDB (which also handles Firestore debouncing internally)
      updateContentRTDB(id, updates, immediate);
    } else {
      // RTDB disabled: Fall back to direct Firestore update
      return updateContentFS(id, updates);
    }
  }, [updateContentRTDB, updateContentFS]);

  // Wrap deleteContent to remove from RTDB
  const deleteContent = React.useCallback((id: string) => {
    removeContentRTDB(id);
    return deleteContentFS(id);
  }, [removeContentRTDB, deleteContentFS]);

  // Create is Firestore-only (initial creation)
  const createContent = createContentFS;

  // Get content and contentIds directly from Zustand store for immediate UI updates
  const storeContent = useCanvasStore((state) => state.content);
  const storeContentIds = useCanvasStore((state) => state.contentIds);

  // Order content based on contentIds (z-index)
  const orderedContent = React.useMemo(() => {
    if (storeContentIds.length === 0) {
      return storeContent;
    }

    const contentMap = new Map(storeContent.map(c => [c.id, c]));
    const ordered: Content[] = [];

    // Add content in the order specified by contentIds
    storeContentIds.forEach(id => {
      const item = contentMap.get(id);
      if (item) {
        ordered.push(item);
        contentMap.delete(id);
      }
    });

    // Add any remaining items not in contentIds (new items)
    contentMap.forEach(item => {
      ordered.push(item);
    });

    return ordered;
  }, [storeContent, storeContentIds]);

  const { lockContent: lockContentFS, unlockContent: unlockContentFS } = useContentLocking(orderedContent);

  // Wrap locking to use RTDB when enabled
  const lockContent = React.useCallback(async (id: string) => {
    const enableRTDB = localStorage.getItem('enableRTDB');
    if (enableRTDB !== 'false') {
      // RTDB enabled: Use RTDB locking
      await acquireLockRTDB(id);
    } else {
      // RTDB disabled: Fall back to Firestore locking
      await lockContentFS(id);
    }
  }, [acquireLockRTDB, lockContentFS]);

  const unlockContent = React.useCallback(async (id: string) => {
    const enableRTDB = localStorage.getItem('enableRTDB');
    if (enableRTDB !== 'false') {
      // RTDB enabled: Use RTDB unlocking
      await releaseLockRTDB(id);
    } else {
      // RTDB disabled: Fall back to Firestore unlocking
      await unlockContentFS(id);
    }
  }, [releaseLockRTDB, unlockContentFS]);

  // Selection-based locking (RTDB only)
  const setSelection = React.useCallback(async (id: string | null) => {
    const enableRTDB = localStorage.getItem('enableRTDB');
    if (enableRTDB !== 'false') {
      // RTDB enabled: Use RTDB selection tracking
      await setSelectionRTDB(id);
    } else if (id) {
      // RTDB disabled: Just use basic locking for selection
      await lockContentFS(id);
    } else {
      // Deselection: release all locks
      // Note: This may need more sophisticated handling for Firestore-only mode
    }
  }, [setSelectionRTDB, lockContentFS]);

  // deleteContent already removes from contentIds in the store, no need to wrap

  const retry = () => {
    // This needs to be implemented to re-trigger the firestore sync
  };

  return {
    content: orderedContent, // Return ordered content based on contentIds (z-index)
    createContent,
    createContentBatch,
    updateContent,
    updateContentBatch,
    deleteContent,
    deleteContentBatch,
    clearAllContent,
    loading,
    error,
    retry,
    lockContent,
    unlockContent,
    setSelection,
    flushToFirestore: flushFirestoreUpdate,
    startEditingContent,
    stopEditingContent,
    // Z-index operations
    addToContentIds,
    removeFromContentIds,
    bringToFront,
    sendToBack,
    moveUp,
    moveDown,
    // Legacy exports for backward compatibility during migration
    shapes: orderedContent,
    createShape: createContent,
    createShapeBatch: createContentBatch,
    updateShape: updateContent,
    updateShapeBatch: updateContentBatch,
    deleteShape: deleteContent,
    deleteShapeBatch: deleteContentBatch,
    clearAllShapes: clearAllContent,
    lockShape: lockContent,
    unlockShape: unlockContent,
    startEditingShape: startEditingContent,
    stopEditingShape: stopEditingContent,
  };
};

// Legacy export for backward compatibility during migration
export const useShapes = useContent;