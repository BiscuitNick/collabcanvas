import React from 'react';
import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useContentOperations } from './firestore/useContentOperations';
import { useContentLocking } from './firestore/useContentLocking';
import { useContentOrdering } from './firestore/useContentOrdering';
import { useCanvasStore } from '../store/canvasStore';
import { useCanvasId } from '../contexts/CanvasContext';
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

  // Get Firestore ordering operations (for syncing to Firestore when enabled)
  const { bringToFront: fsBringToFront, sendToBack: fsSendToBack, moveUp: fsMoveUp, moveDown: fsMoveDown } = useContentOrdering(canvasId);

  // Wrapper functions that update store first, then sync to Firestore
  const addToContentIds = async (id: string) => {
    storeAddToContentIds(id);
    // Sync to Firestore will happen via useFirestoreSync
  };

  const removeFromContentIds = async (id: string) => {
    storeRemoveFromContentIds(id);
    // Sync to Firestore will happen via useFirestoreSync
  };

  const bringToFront = (id: string) => {
    storeBringToFront(id);
    fsBringToFront(id); // Sync to Firestore
  };

  const sendToBack = (id: string) => {
    storeSendToBack(id);
    fsSendToBack(id); // Sync to Firestore
  };

  const moveUp = (id: string) => {
    storeMoveUp(id);
    fsMoveUp(id); // Sync to Firestore
  };

  const moveDown = (id: string) => {
    storeMoveDown(id);
    fsMoveDown(id); // Sync to Firestore
  };

  // Pass addToContentIds to content operations so they can add IDs after creation
  const { createContent, updateContent, deleteContent, clearAllContent, startEditingContent, stopEditingContent, createContentBatch, updateContentBatch, deleteContentBatch } = useContentOperations(
    firestoreContent,
    setContent,
    activelyEditingRef,
    isCreatingContent,
    user?.uid,
    addToContentIds  // Pass this so it can be called with the real Firestore ID
  );

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

  const { lockContent, unlockContent } = useContentLocking(orderedContent);

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