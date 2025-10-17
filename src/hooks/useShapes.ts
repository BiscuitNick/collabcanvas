import { useAuth } from './useAuth';
import { useFirestoreSync } from './firestore/useFirestoreSync';
import { useShapeOperations } from './firestore/useShapeOperations';
import { useShapeLocking } from './firestore/useShapeLocking';

export const useShapes = () => {
  const { user } = useAuth();
  const { shapes, loading, error, activelyEditingRef, isCreatingShape } = useFirestoreSync(user?.uid);
  const { createShape, updateShape, deleteShape, clearAllShapes, startEditingShape, stopEditingShape } = useShapeOperations(
    shapes,
    activelyEditingRef,
    isCreatingShape
  );
  const { lockShape, unlockShape } = useShapeLocking(shapes);

  const retry = () => {
    // This needs to be implemented to re-trigger the firestore sync
  };

  return {
    shapes,
    createShape,
    updateShape,
    deleteShape,
    clearAllShapes,
    loading,
    error,
    retry,
    lockShape,
    unlockShape,
    startEditingShape,
    stopEditingShape,
  };
};