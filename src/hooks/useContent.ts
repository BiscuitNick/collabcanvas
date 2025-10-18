import { useEffect } from 'react';
import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useContentOperations } from './firestore/useContentOperations';
import { useContentLocking } from './firestore/useContentLocking';
import { useCanvasStore } from '../store/canvasStore';

export const useContent = () => {
  const { user } = useAuth();
  const { content: firestoreContent, setContent, loading, error, activelyEditingRef, isCreatingContent } = useFirestoreSync(user?.uid);
  const { createContent, updateContent, deleteContent, clearAllContent, startEditingContent, stopEditingContent } = useContentOperations(
    firestoreContent,
    setContent,
    activelyEditingRef,
    isCreatingContent
  );
  // Get content directly from Zustand store for immediate UI updates
  const storeContent = useCanvasStore((state) => state.content);

  // Debug logging
  useEffect(() => {
    console.log('🎨 useContent: Store content updated', {
      count: storeContent.length,
      ids: storeContent.map(c => c.id)
    });
  }, [storeContent]);

  const { lockContent, unlockContent } = useContentLocking(storeContent);

  const retry = () => {
    // This needs to be implemented to re-trigger the firestore sync
  };

  return {
    content: storeContent, // Use store content for immediate UI updates
    createContent,
    updateContent,
    deleteContent,
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
    updateShape: updateContent,
    deleteShape: deleteContent,
    clearAllShapes: clearAllContent,
    lockShape: lockContent,
    unlockShape: unlockContent,
    startEditingShape: startEditingContent,
    stopEditingShape: stopEditingContent,
  };
};

// Legacy export for backward compatibility during migration
export const useShapes = useContent;