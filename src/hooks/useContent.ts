import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useContentOperations } from './firestore/useContentOperations';
import { useContentLocking } from './firestore/useContentLocking';

export const useContent = () => {
  const { user } = useAuth();
  const { content, setContent, loading, error, activelyEditingRef, isCreatingContent } = useFirestoreSync(user?.uid);
  const { createContent, updateContent, deleteContent, clearAllContent, startEditingContent, stopEditingContent } = useContentOperations(
    content,
    setContent,
    activelyEditingRef,
    isCreatingContent
  );
  const { lockContent, unlockContent } = useContentLocking(content);

  const retry = () => {
    // This needs to be implemented to re-trigger the firestore sync
  };

  return {
    content,
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
    shapes: content,
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