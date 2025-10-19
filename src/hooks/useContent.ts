import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useContentOperations } from './firestore/useContentOperations';
import { useContentLocking } from './firestore/useContentLocking';
import { useCanvasStore } from '../store/canvasStore';

export const useContent = () => {
  const { user } = useAuth();
  const { content: firestoreContent, setContent, loading, error, activelyEditingRef, isCreatingContent } = useFirestoreSync(user?.uid);
  const { createContent, updateContent, deleteContent, clearAllContent, startEditingContent, stopEditingContent, createContentBatch, updateContentBatch, deleteContentBatch } = useContentOperations(
    firestoreContent,
    setContent,
    activelyEditingRef,
    isCreatingContent,
    user?.uid
  );
  // Get content directly from Zustand store for immediate UI updates
  const storeContent = useCanvasStore((state) => state.content);

  const { lockContent, unlockContent } = useContentLocking(storeContent);

  const retry = () => {
    // This needs to be implemented to re-trigger the firestore sync
  };

  return {
    content: storeContent, // Use store content for immediate UI updates
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
    // Legacy exports for backward compatibility during migration
    shapes: storeContent,
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