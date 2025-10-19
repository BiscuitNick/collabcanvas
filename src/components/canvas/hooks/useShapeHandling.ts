
import { useCallback } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { Content } from '../../../types';

interface ShapeHandlingProps {
  updateShape: (id: string, updates: Partial<Content>, immediate?: boolean) => Promise<void>;
  lockShape?: (id: string) => Promise<void>;
  unlockShape?: (id: string) => Promise<void>;
  setSelection?: (id: string | null) => Promise<void>;
  startEditingShape?: (id: string) => void;
  stopEditingShape?: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  flushToFirestore?: (id: string) => Promise<void>;
}

export const useShapeHandling = ({
  updateShape,
  lockShape,
  unlockShape,
  setSelection,
  startEditingShape,
  stopEditingShape,
  onDragStart,
  onDragEnd,
  flushToFirestore,
}: ShapeHandlingProps) => {
  const { selectedContentId, selectShape, setDraggingShape } = useCanvasStore();
  // Use selectedContentId directly instead of the getter selectedShapeId for proper reactivity
  const selectedShapeId = selectedContentId;

  const handleShapeSelect = useCallback(
    async (shapeId: string) => {
      // Lock checking is now handled by components via lockInfo prop
      // Components will prevent selection of locked items

      // Clear previous selection if different
      if (selectedShapeId && selectedShapeId !== shapeId) {
        if (setSelection) {
          // This will release the lock on the previous item
          await setSelection(null);
        } else if (unlockShape) {
          await unlockShape(selectedShapeId);
        }
      }

      // Update local selection state
      selectShape(shapeId);

      // Acquire lock for the new selection
      if (setSelection) {
        await setSelection(shapeId);
      } else if (lockShape) {
        // Fallback to old locking mechanism
        await lockShape(shapeId);
      }
    },
    [selectShape, lockShape, unlockShape, setSelection, selectedShapeId]
  );

  const handleShapeUpdate = useCallback(
    (shapeId: string, updates: Partial<Content>) => {
      // Lock checking is now handled by components via lockInfo prop
      updateShape(shapeId, updates);
    },
    [updateShape]
  );

  const handleShapeDragStart = useCallback(
    (shapeId: string) => {
      // Lock checking is now handled by components via lockInfo prop
      setDraggingShape(true);
      startEditingShape?.(shapeId);
      onDragStart?.();
    },
    [startEditingShape, onDragStart, setDraggingShape]
  );

  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      // Lock checking is now handled by components via lockInfo prop
      updateShape(shapeId, { x, y });
    },
    [updateShape]
  );

  const handleShapeDragEnd = useCallback(
    async (shapeId: string, x: number, y: number) => {
      // Lock checking is now handled by components via lockInfo prop

      // Update position with immediate flag to sync RTDB immediately
      await updateShape(shapeId, { x, y }, true);
      stopEditingShape?.(shapeId);

      // Flush to Firestore to ensure consistency
      if (flushToFirestore) {
        await flushToFirestore(shapeId);
      }

      onDragEnd?.();
    },
    [updateShape, stopEditingShape, onDragEnd, flushToFirestore]
  );

  return {
    handleShapeSelect,
    handleShapeUpdate,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
  };
};
