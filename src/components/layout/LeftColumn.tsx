import React from 'react';
import type { Rectangle, PresenceUser, Cursor as CursorType } from '../../types';
import AIWidget from '../canvas/AIWidget';
import CollapsibleSection from './CollapsibleSection';
import CanvasControls from './controls/CanvasControls';
import ShapeControls from './controls/ShapeControls';
import UserControls from './controls/UserControls';
import DebugControls from './controls/DebugControls';
import UserAccount from './controls/UserAccount';
import { useCanvasStore } from '../../store/canvasStore';

interface LeftColumnProps {
  viewportWidth: number;
  viewportHeight: number;
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  clearAllShapes: () => Promise<void>;
  shapesError: string | null;
  onRetry: () => void;
  presenceUsers: PresenceUser[];
  cursors: CursorType[];
  shapes: Rectangle[];
  onUserClick?: (userId: string) => void;
  onShapeSelect?: (shapeId: string) => void;
  onDebugStateChange?: (showSelfCursor: boolean, showFPS: boolean, enableViewportCulling: boolean) => void;
  visibleShapesCount?: number;
}

const LeftColumn: React.FC<LeftColumnProps> = ({
  viewportWidth,
  viewportHeight,
  createShape,
  deleteShape,
  clearAllShapes,
  shapesError,
  onRetry,
  presenceUsers,
  cursors,
  shapes,
  onUserClick,
  onShapeSelect,
  onDebugStateChange,
  visibleShapesCount = 0,
}) => {
  const { stageScale, stagePosition } = useCanvasStore();

  return (
    <div className="p-4 space-y-4 flex flex-col h-full">
      {shapesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="h-4 w-4 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700">{shapesError}</span>
            </div>
            <button onClick={onRetry} className="text-sm text-red-600 hover:text-red-800 underline">
              Retry
            </button>
          </div>
        </div>
      )}

      <CollapsibleSection title="Canvas Controls" defaultOpen={true}>
        <CanvasControls viewportWidth={viewportWidth} viewportHeight={viewportHeight} />
      </CollapsibleSection>

      <CollapsibleSection title="AI Assistant" defaultOpen={true}>
        <AIWidget createShape={createShape} stageScale={stageScale} stagePosition={stagePosition} />
      </CollapsibleSection>

      <CollapsibleSection title="Shape Controls" defaultOpen={true}>
        <ShapeControls
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
          createShape={createShape}
          deleteShape={deleteShape}
          clearAllShapes={clearAllShapes}
          shapes={shapes}
          onShapeSelect={onShapeSelect}
        />
      </CollapsibleSection>

      <CollapsibleSection title="Online Users" defaultOpen={true}>
        <UserControls presenceUsers={presenceUsers} cursors={cursors} onUserClick={onUserClick} />
      </CollapsibleSection>

      <CollapsibleSection title="Debug" defaultOpen={true}>
        <DebugControls
          presenceUsers={presenceUsers}
          cursors={cursors}
          shapes={shapes}
          onDebugStateChange={onDebugStateChange}
          visibleShapesCount={visibleShapesCount}
          viewportWidth={viewportWidth}
          viewportHeight={viewportHeight}
        />
      </CollapsibleSection>

      <UserAccount />
    </div>
  );
};

export default LeftColumn;