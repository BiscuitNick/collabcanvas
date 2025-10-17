
import { useCallback } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { Content } from '../../../types';

interface ShapeHandlingProps {
  content: Content[];
  currentUserId?: string;
  updateShape: (id: string, updates: Partial<Content>) => Promise<void>;
  lockShape?: (id: string) => Promise<void>;
  unlockShape?: (id: string) => Promise<void>;
  startEditingShape?: (id: string) => void;
  stopEditingShape?: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export const useShapeHandling = ({
  content,
  currentUserId,
  updateShape,
  lockShape,
  unlockShape,
  startEditingShape,
  stopEditingShape,
  onDragStart,
  onDragEnd,
}: ShapeHandlingProps) => {
  const { selectedShapeId, selectShape, setDraggingShape } = useCanvasStore();

  const handleShapeSelect = useCallback(
    (shapeId: string) => {
      const shape = content.find((s) => s.id === shapeId);
      const isLockedByOther = shape?.lockedByUserId && shape.lockedByUserId !== currentUserId;

      if (selectedShapeId && selectedShapeId !== shapeId && unlockShape) {
        unlockShape(selectedShapeId);
      }

      selectShape(shapeId);

      if (lockShape && !isLockedByOther) {
        lockShape(shapeId);
      }
    },
    [selectShape, lockShape, unlockShape, selectedShapeId, content, currentUserId]
  );

  const handleShapeUpdate = useCallback(
    (shapeId: string, updates: Partial<Content>) => {
      updateShape(shapeId, updates);
    },
    [updateShape]
  );

  const handleShapeDragStart = useCallback(
    (shapeId: string) => {
      setDraggingShape(true);
      startEditingShape?.(shapeId);
      onDragStart?.();
    },
    [startEditingShape, onDragStart, setDraggingShape]
  );

  const handleShapeDragMove = useCallback(
    (shapeId: string, x: number, y: number) => {
      updateShape(shapeId, { x, y });
    },
    [updateShape]
  );

  const handleShapeDragEnd = useCallback(
    (shapeId: string, x: number, y: number) => {
      updateShape(shapeId, { x, y });
      stopEditingShape?.(shapeId);
      onDragEnd?.();
    },
    [updateShape, stopEditingShape, onDragEnd]
  );

  return {
    handleShapeSelect,
    handleShapeUpdate,
    handleShapeDragStart,
    handleShapeDragMove,
    handleShapeDragEnd,
  };
};
