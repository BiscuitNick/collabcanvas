
import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { PresenceUser, Cursor as CursorType } from '../../../types';

interface DebugControlsProps {
  presenceUsers: PresenceUser[];
  cursors: CursorType[];
  shapes: { id: string }[];
  onDebugStateChange?: (showSelfCursor: boolean, showFPS: boolean, enableViewportCulling: boolean) => void;
  visibleShapesCount?: number;
  viewportWidth: number;
  viewportHeight: number;
}

const DebugControls: React.FC<DebugControlsProps> = ({
  presenceUsers,
  cursors,
  shapes,
  onDebugStateChange,
  visibleShapesCount = 0,
  viewportWidth,
  viewportHeight,
}) => {
  const { stageScale, stagePosition } = useCanvasStore();
  const [showSelfCursor, setShowSelfCursor] = useState(false);
  const [showFPS, setShowFPS] = useState(() => {
    const saved = localStorage.getItem('showFPS');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [enableViewportCulling, setEnableViewportCulling] = useState(() => {
    const saved = localStorage.getItem('enableViewportCulling');
    return saved !== null ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('showFPS', JSON.stringify(showFPS));
  }, [showFPS]);

  useEffect(() => {
    localStorage.setItem('enableViewportCulling', JSON.stringify(enableViewportCulling));
  }, [enableViewportCulling]);

  useEffect(() => {
    if (onDebugStateChange) {
      onDebugStateChange(showSelfCursor, showFPS, enableViewportCulling);
    }
  }, [showSelfCursor, showFPS, enableViewportCulling, onDebugStateChange]);

  const getUserCursor = (userId: string) => {
    return cursors.find((cursor) => cursor.userId === userId);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700">Show Self Cursor</label>
        <button
          onClick={() => setShowSelfCursor(!showSelfCursor)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            showSelfCursor ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showSelfCursor ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm text-gray-700">Show FPS Monitor</label>
        <button
          onClick={() => setShowFPS(!showFPS)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            showFPS ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              showFPS ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-700">Enable Viewport Culling</label>
          <button
            onClick={() => setEnableViewportCulling(!enableViewportCulling)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              enableViewportCulling ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                enableViewportCulling ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-gray-500">Viewport culling - only renders visible shapes</p>
      </div>

      <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded text-xs space-y-2">
        <div className="font-medium text-gray-800">Debug Information</div>
        <div className="text-gray-600 space-y-1">
          <div className="flex justify-between">
            <span>Total Users:</span>
            <span>{presenceUsers.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Users:</span>
            <span>{presenceUsers.filter((user) => getUserCursor(user.userId)).length}</span>
          </div>
          <div className="flex justify-between">
            <span>Active Cursors:</span>
            <span>{cursors.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Canvas Scale:</span>
            <span>{(stageScale * 100).toFixed(1)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Canvas Position:</span>
            <span className="font-mono">
              ({Math.round(stagePosition.x)}, {Math.round(stagePosition.y)})
            </span>
          </div>
          <div className="flex justify-between">
            <span>Viewport Size:</span>
            <span className="font-mono">
              {viewportWidth}×{viewportHeight}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Effective Canvas Size:</span>
            <span className="font-mono">
              {Math.round(viewportWidth / stageScale)}×{Math.round(viewportHeight / stageScale)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Shapes:</span>
            <span>{shapes.length}</span>
          </div>
          {enableViewportCulling && (
            <div className="flex justify-between">
              <span>Rendered Shapes:</span>
              <span className={visibleShapesCount < shapes.length ? 'text-green-600 font-semibold' : ''}>
                {visibleShapesCount}{' '}
                {visibleShapesCount < shapes.length && `(${Math.round((visibleShapesCount / shapes.length) * 100)}%)`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DebugControls;
