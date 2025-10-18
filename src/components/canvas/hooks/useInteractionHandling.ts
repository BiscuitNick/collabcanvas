
import { useState } from 'react';
import Konva from 'konva';
import { useCanvasStore } from '../../../store/canvasStore';
import { CANVAS_HALF } from '../../../lib/constants';
import { getZoomStep } from '../../../lib/utils';

interface InteractionHandlingProps {
  width: number;
  height: number;
  onMouseMove: (x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'ai' | 'pan' | 'agent' | null;
  onCanvasClick?: (event: { x: number; y: number }) => void;
  isCreatingShape?: boolean;
  unlockShape?: (id: string) => Promise<void>;
}

export const useInteractionHandling = ({
  width,
  height,
  onMouseMove,
  onPanStart,
  onPanEnd,
  onCanvasClick,
  isCreatingShape,
  unlockShape,
}: Omit<InteractionHandlingProps, 'selectedTool'>) => {
  const {
    stagePosition,
    stageScale,
    isPanning,
    isZooming,
    isDraggingShape,
    selectedContentId,
    updatePosition,
    updateScale,
    setPanning,
    setZooming,
    selectShape,
  } = useCanvasStore();

  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastTouchCenter, setLastTouchCenter] = useState<{ x: number; y: number } | null>(null);

  const clampPosition = (x: number, y: number) => {
    const minX = -CANVAS_HALF;
    const maxX = CANVAS_HALF;
    const minY = -CANVAS_HALF;
    const maxY = CANVAS_HALF;

    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y)),
    };
  };

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // Don't start panning if we clicked on a shape (anything other than the stage itself)
    const clickedOnShape = e.target !== stage;

    if (isDraggingShape || clickedOnShape) {
      // Prevent stage from dragging when interacting with shapes
      e.target.stopDrag?.();
      return;
    }

    setPanning(true);
    setZooming(false);
    onPanStart?.();
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const stage = e.target.getStage();
    if (!stage) return;

    // If we're dragging a shape or if the drag target is not the stage itself, don't update canvas position
    const draggedShape = e.target !== stage;

    if (isDraggingShape || draggedShape) {
      return;
    }

    setPanning(false);
    onPanEnd?.();
    const clampedPos = clampPosition(e.target.x(), e.target.y());
    updatePosition(clampedPos.x, clampedPos.y);

    if (onMouseMove) {
      const pointer = stage.getPointerPosition();
      if (pointer) {
        const transform = stage.getAbsoluteTransform().copy().invert();
        const canvasPoint = transform.point({ x: pointer.x, y: pointer.y });
        onMouseMove(canvasPoint.x, canvasPoint.y, width, height);
      }
    }
  };

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    if (isPanning || isDraggingShape) return;

    setZooming(true);
    const stage = e.target.getStage();
    const oldScale = stage?.scaleX();
    const pointer = stage?.getPointerPosition();

    if (!pointer || !stage || oldScale === undefined) {
      setZooming(false);
      return;
    }

    const currentPercentage = Math.round(oldScale * 100);
    const step = getZoomStep(currentPercentage);
    const newPercentage = e.evt.deltaY > 0 ? Math.max(1, currentPercentage - step) : Math.min(300, currentPercentage + step);
    const newScale = newPercentage / 100;
    updateScale(newScale);

    const newPos = {
      x: pointer.x - ((pointer.x - stage.x()) / oldScale) * newScale,
      y: pointer.y - ((pointer.y - stage.y()) / oldScale) * newScale,
    };

    setZooming(false);
    const clampedPos = clampPosition(newPos.x, newPos.y);
    updatePosition(clampedPos.x, clampedPos.y);
  };

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    // Prevent event bubbling
    e.cancelBubble = true;

    const stage = e.target.getStage();
    if (!stage) return;

    // Check if we clicked on the stage background (not on a shape)
    const clickedOnEmpty = e.target === stage;

    // Get pointer position and canvas coordinates
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;

    const transform = stage.getAbsoluteTransform().copy().invert();
    const canvasPoint = transform.point({ x: pointerPosition.x, y: pointerPosition.y });

    if (clickedOnEmpty) {
      // Clicked on empty canvas area
      console.log('🖱️ Canvas clicked - Empty area at:', { x: canvasPoint.x.toFixed(2), y: canvasPoint.y.toFixed(2) });

      // Unlock the currently selected shape before deselecting
      if (selectedContentId && unlockShape) {
        unlockShape(selectedContentId);
      }

      // Always deselect current shape when clicking empty canvas or placing new shape
      selectShape(null);

      // If creating a shape, trigger the shape creation
      if (isCreatingShape && onCanvasClick) {
        onCanvasClick({ x: canvasPoint.x, y: canvasPoint.y });
        return;
      }
    } else {
      // Clicked on a shape - the shape's onSelect handler will be called via ShapeFactory
      // The shape's onClick handler will call onSelect which handles switching selection
      // Just log the click for debugging
      const shapeId = e.target.id() || 'unknown';
      const shapeName = e.target.name() || e.target.className;
      console.log('🖱️ Canvas clicked - Shape:', {
        type: shapeName,
        id: shapeId,
        x: canvasPoint.x.toFixed(2),
        y: canvasPoint.y.toFixed(2)
      });
    }
  };

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (onMouseMove) {
      const stage = e.target.getStage();
      if (stage) {
        const pointer = stage.getPointerPosition();
        if (pointer) {
          const transform = stage.getAbsoluteTransform().copy().invert();
          const canvasPoint = transform.point({ x: pointer.x, y: pointer.y });
          onMouseMove(canvasPoint.x, canvasPoint.y, width, height);
        }
      }
    }
  };

  const handleMouseLeave = () => {};

  const getTouchDistance = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
  };

  const getTouchCenter = (touches: TouchList) => {
    if (touches.length < 2) return null;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return { x: (touch1.clientX + touch2.clientX) / 2, y: (touch1.clientY + touch2.clientY) / 2 };
  };

  const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;
    if (touches.length === 1) {
      setPanning(true);
      setZooming(false);
    } else if (touches.length === 2) {
      setPanning(false);
      setZooming(true);
      const distance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      if (distance) setLastTouchDistance(distance);
      if (center) setLastTouchCenter(center);
    }
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const touches = e.evt.touches;
    if (touches.length === 1 && isPanning) {
      const touch = touches[0];
      const stage = e.target.getStage();
      if (stage) {
        const rect = stage.container().getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        const clampedPos = clampPosition(x, y);
        updatePosition(clampedPos.x, clampedPos.y);
      }
    } else if (touches.length === 2 && isZooming) {
      const distance = getTouchDistance(touches);
      const center = getTouchCenter(touches);
      if (distance && lastTouchDistance && center && lastTouchCenter) {
        const scaleBy = distance / lastTouchDistance;
        const newScale = stageScale * scaleBy;
        const clampedScale = Math.max(0.1, Math.min(3, newScale));
        updateScale(clampedScale);

        const stage = e.target.getStage();
        if (stage) {
          const rect = stage.container().getBoundingClientRect();
          const stageX = center.x - rect.left;
          const stageY = center.y - rect.top;
          const mousePointTo = { x: (stageX - stagePosition.x) / stageScale, y: (stageY - stagePosition.y) / stageScale };
          const newPos = { x: stageX - mousePointTo.x * clampedScale, y: stageY - mousePointTo.y * clampedScale };
          const clampedPos = clampPosition(newPos.x, newPos.y);
          updatePosition(clampedPos.x, clampedPos.y);
        }
      }
      if (distance) setLastTouchDistance(distance);
      if (center) setLastTouchCenter(center);
    }
  };

  const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    setPanning(false);
    setZooming(false);
    setLastTouchDistance(null);
    setLastTouchCenter(null);
  };

  return {
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onWheel: handleWheel,
    onClick: handleStageClick,
    onTap: handleStageClick, // Use same handler for tap events on mobile
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
};
