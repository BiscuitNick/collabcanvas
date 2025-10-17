
import { useRef, useCallback } from 'react';
import { clamp } from '../../../lib/utils';
import { CANVAS_HALF, MIN_SHAPE_SIZE, MAX_SHAPE_SIZE } from '../../../lib/constants';
import { RECTANGLE_DRAG_THROTTLE_MS, RECTANGLE_DRAG_DEBOUNCE_MS, ENABLE_PERFORMANCE_LOGGING } from '../../../lib/config';
import Konva from 'konva';

interface ShapeInteractionProps {
  shape: { width: number; height: number };
  onDragMove?: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDragStart: () => void;
  onDragEndCallback: () => void;
  onUpdate: (updates: Partial<{ x: number; y: number; width: number; height: number }>) => void;
}

export const useShapeInteraction = ({
  shape,
  onDragMove,
  onDragEnd,
  onDragStart,
  onDragEndCallback,
  onUpdate,
}: ShapeInteractionProps) => {
  const lastUpdateRef = useRef<number>(0);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdateRef = useRef<{ x: number; y: number } | null>(null);

  const throttledDragMove = useCallback(
    (x: number, y: number) => {
      if (!onDragMove) return;

      const now = Date.now();
      pendingUpdateRef.current = { x, y };

      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }

      throttleTimeoutRef.current = setTimeout(() => {
        const pendingUpdate = pendingUpdateRef.current;
        if (!pendingUpdate) return;

        if (now - lastUpdateRef.current >= RECTANGLE_DRAG_THROTTLE_MS) {
          const startTime = ENABLE_PERFORMANCE_LOGGING ? performance.now() : 0;
          const clampedX = clamp(pendingUpdate.x, -CANVAS_HALF, CANVAS_HALF - shape.width);
          const clampedY = clamp(pendingUpdate.y, -CANVAS_HALF, CANVAS_HALF - shape.height);
          onDragMove(clampedX, clampedY);
          lastUpdateRef.current = now;
          pendingUpdateRef.current = null;
          if (ENABLE_PERFORMANCE_LOGGING) {
            const duration = performance.now() - startTime;
            console.log(`📝 Shape drag update took ${duration.toFixed(2)}ms`);
          }
        }
      }, RECTANGLE_DRAG_DEBOUNCE_MS);
    },
    [onDragMove, shape.width, shape.height]
  );

  const handleDragStart = () => {
    onDragStart();
  };

  const handleDragMove = (e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    throttledDragMove(target.x(), target.y());
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const target = e.target;
    const clampedX = clamp(target.x(), -CANVAS_HALF, CANVAS_HALF - shape.width);
    const clampedY = clamp(target.y(), -CANVAS_HALF, CANVAS_HALF - shape.height);
    onDragEnd(clampedX, clampedY);
    onDragEndCallback();
  };

  const handleTransformEnd = (node: Konva.Node) => {
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const newWidth = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, node.width() * scaleX));
    const newHeight = Math.max(MIN_SHAPE_SIZE, Math.min(MAX_SHAPE_SIZE, node.height() * scaleY));
    const newX = node.x();
    const newY = node.y();
    const clampedX = clamp(newX, -CANVAS_HALF, CANVAS_HALF - newWidth);
    const clampedY = clamp(newY, -CANVAS_HALF, CANVAS_HALF - newHeight);

    onUpdate({
      x: clampedX,
      y: clampedY,
      width: newWidth,
      height: newHeight,
    });

    node.scaleX(1);
    node.scaleY(1);
    node.width(newWidth);
    node.height(newHeight);
    node.x(clampedX);
    node.y(clampedY);
  };

  return { handleDragStart, handleDragMove, handleDragEnd, handleTransformEnd };
};
