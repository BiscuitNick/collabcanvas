import React, { useRef, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import Konva from 'konva';
import { useCanvasStore } from '../../store/canvasStore';
import CanvasErrorBoundary from './CanvasErrorBoundary';
import ShapeFactory from './ShapeFactory';
import Cursor from '../multiplayer/Cursor';
import type { Content, Cursor as CursorType } from '../../types';
import { useCursorContext } from '../../hooks/useCursorContext';
import { useInteractionHandling } from './hooks/useInteractionHandling';
import { useShapeHandling } from './hooks/useShapeHandling';
import { useViewportCulling } from './hooks/useViewportCulling';

export interface CanvasProps {
  width: number;
  height: number;
  content: Content[];
  cursors: CursorType[];
  updateShape: (id: string, updates: Partial<Content>) => Promise<void>;
  onMouseMove: (x: number, y: number, canvasWidth: number, canvasHeight: number) => void;
  showSelfCursor?: boolean;
  currentUserId?: string;
  enableViewportCulling?: boolean;
  onVisibleShapesChange?: (visibleCount: number) => void;
  lockShape?: (id: string) => Promise<void>;
  unlockShape?: (id: string) => Promise<void>;
  startEditingShape?: (id: string) => void;
  stopEditingShape?: (id: string) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onPanStart?: () => void;
  onPanEnd?: () => void;
  selectedTool?: 'select' | 'rectangle' | 'circle' | 'text' | 'image' | 'ai' | 'pan' | null;
  onCanvasClick?: (event: { x: number; y: number }) => void;
  isCreatingShape?: boolean;
}

const Canvas: React.FC<CanvasProps> = ({
  width,
  height,
  content,
  cursors,
  updateShape,
  onMouseMove,
  showSelfCursor = true,
  currentUserId,
  enableViewportCulling = true,
  onVisibleShapesChange,
  lockShape,
  unlockShape,
  startEditingShape,
  stopEditingShape,
  onDragStart,
  onDragEnd,
  onPanStart,
  onPanEnd,
  selectedTool,
  onCanvasClick,
  isCreatingShape = false,
}) => {
  const stageRef = useRef<Konva.Stage>(null);
  const { stagePosition, stageScale, isZooming, isDraggingShape, isPanning, selectedShapeId, setDraggingShape } = useCanvasStore();

  useCursorContext({
    selectedTool: selectedTool || null,
    isDragging: isDraggingShape,
    isPanning: isPanning,
    isResizing: false, // TODO: Add resize state
  });

  const { handleShapeSelect, handleShapeUpdate, handleShapeDragStart, handleShapeDragMove, handleShapeDragEnd } = useShapeHandling({
    content,
    currentUserId,
    updateShape,
    lockShape,
    unlockShape,
    startEditingShape,
    stopEditingShape,
    onDragStart,
    onDragEnd,
  });

  const interactionHandlers = useInteractionHandling({
    width,
    height,
    onMouseMove,
    onPanStart,
    onPanEnd,
    onCanvasClick,
    isCreatingShape,
  });

  const visibleShapes = useViewportCulling({
    content,
    width,
    height,
    enableViewportCulling,
    onVisibleShapesChange,
  });

  const renderedShapes = useMemo(() => {
    return visibleShapes.map((shape) => (
      <ShapeFactory
        key={shape.id}
        shape={shape}
        isSelected={selectedShapeId === shape.id}
        onSelect={() => handleShapeSelect(shape.id)}
        onUpdate={(updates) => handleShapeUpdate(shape.id, updates)}
        onDragMove={(x, y) => handleShapeDragMove(shape.id, x, y)}
        onDragEnd={(x, y) => handleShapeDragEnd(shape.id, x, y)}
        onDragStart={() => handleShapeDragStart(shape.id)}
        onDragEndCallback={() => setDraggingShape(false)}
        currentUserId={currentUserId}
      />
    ));
  }, [visibleShapes, selectedShapeId, handleShapeSelect, handleShapeUpdate, handleShapeDragMove, handleShapeDragEnd, handleShapeDragStart, setDraggingShape, currentUserId]);

  return (
    <CanvasErrorBoundary>
      <div className="canvas-container">
        <Stage
          ref={stageRef}
          width={width}
          height={height}
          x={stagePosition.x}
          y={stagePosition.y}
          scaleX={stageScale}
          scaleY={stageScale}
          draggable={!isZooming && !isDraggingShape}
          {...interactionHandlers}
        >
          <Layer>{renderedShapes}</Layer>
          <Layer>
            {cursors
              .filter((cursor) => {
                if (cursor.isVisible === false) return false;
                if (!showSelfCursor && currentUserId && cursor.userId === currentUserId) return false;
                return true;
              })
              .map((cursor) => (
                <Cursor key={cursor.userId} cursor={cursor} />
              ))}
          </Layer>
        </Stage>
      </div>
    </CanvasErrorBoundary>
  );
};

export default Canvas;