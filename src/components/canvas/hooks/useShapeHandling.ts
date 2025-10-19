
import { useCallback } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { Content } from '../../../types';

interface ShapeHandlingProps {
  content: Content[];
  currentUserId?: string;
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
  content,
  currentUserId,
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
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      // Don't allow selection if locked by another user
      if (isLockedByOther) {
        console.log('🔒 [Lock] Cannot select - locked by:', shape?.lockedByUserName || shape?.lockedByUserId);
        // Don't update selection state if locked
        return;
      }

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
        console.log('✅ [Lock] Selection set for:', shapeId);
      } else if (lockShape) {
        // Fallback to old locking mechanism
        await lockShape(shapeId);
      }
    },
    [selectShape, lockShape, unlockShape, setSelection, selectedShapeId, content, currentUserId]
  );

  const handleShapeUpdate = useCallback(
    (shapeId: string, updates: Partial<Content>) => {
      // Check if shape is locked by another user
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      if (isLockedByOther) {
        console.log('🔒 [Lock] Cannot update - locked by:', shape?.lockedByUserName || shape?.lockedByUserId);
        return;
      }

      updateShape(shapeId, updates);
    },
    [updateShape, content, currentUserId]
  );

  const handleShapeDragStart = useCallback(
    (shapeId: string) => {
      // Check if shape is locked by another user
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      if (isLockedByOther) {
        console.log('🔒 [Lock] Cannot drag - locked by:', shape?.lockedByUserName || shape?.lockedByUserId);
        return;
      }

      setDraggingShape(true);
      startEditingShape?.(shapeId);
      onDragStart?.();
    },
    [startEditingShape, onDragStart, setDraggingShape, content, currentUserId]
  );

  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      // Check if shape is locked by another user
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      if (isLockedByOther) {
        return;
      }

      updateShape(shapeId, { x, y });
    },
    [updateShape, content, currentUserId]
  );

  const handleShapeDragEnd = useCallback(
    async (shapeId: string, x: number, y: number) => {
      // Check if shape is locked by another user
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      if (isLockedByOther) {
        return;
      }

      // Update position with immediate flag to sync RTDB immediately
      await updateShape(shapeId, { x, y }, true);
      stopEditingShape?.(shapeId);

      // Flush to Firestore to ensure consistency
      if (flushToFirestore) {
        await flushToFirestore(shapeId);
      }

      onDragEnd?.();
    },
    [updateShape, stopEditingShape, onDragEnd, flushToFirestore, content, currentUserId]
  );

  return {
    handleShapeSelect,
    handleShapeUpdate,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
  };
};
