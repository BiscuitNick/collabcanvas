
import React, { useState, useEffect, useRef } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { CANVAS_HALF } from '../../../lib/constants';

interface CanvasControlsProps {
  viewportWidth: number;
  viewportHeight: number;
}

const CanvasControls: React.FC<CanvasControlsProps> = ({ viewportWidth, viewportHeight }) => {
  const { stageScale, stagePosition, resetView, updateScale, updatePosition } = useCanvasStore();
  const [zoomInput, setZoomInput] = useState('');
  const [panXInput, setPanXInput] = useState('');
  const [panYInput, setPanYInput] = useState('');
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setZoomInput(Math.round(stageScale * 100).toString());
    setPanXInput(Math.round(stagePosition.x).toString());
    setPanYInput(Math.round(stagePosition.y).toString());
  }, [stageScale, stagePosition]);

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  const handleZoomIn = () => {
    const newScale = Math.min(3, stageScale + 0.1);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const currentCenterX = (centerX - stagePosition.x) / stageScale;
    const currentCenterY = (centerY - stagePosition.y) / stageScale;
    const newX = centerX - currentCenterX * newScale;
    const newY = centerY - currentCenterY * newScale;
    updateScale(newScale);
    updatePosition(newX, newY);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(0.1, stageScale - 0.1);
    const centerX = viewportWidth / 2;
    const centerY = viewportHeight / 2;
    const currentCenterX = (centerX - stagePosition.x) / stageScale;
    const currentCenterY = (centerY - stagePosition.y) / stageScale;
    const newX = centerX - currentCenterX * newScale;
    const newY = centerY - currentCenterY * newScale;
    updateScale(newScale);
    updatePosition(newX, newY);
  };

  const handleResetView = () => {
    resetView();
  };

  const handleZoomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZoomInput(value);
    if (zoomTimeoutRef.current) {
      clearTimeout(zoomTimeoutRef.current);
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      zoomTimeoutRef.current = setTimeout(() => {
        const clampedValue = Math.max(10, Math.min(300, numValue));
        const newScale = clampedValue / 100;
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const currentCenterX = (centerX - stagePosition.x) / stageScale;
        const currentCenterY = (centerY - stagePosition.y) / stageScale;
        const newX = centerX - currentCenterX * newScale;
        const newY = centerY - currentCenterY * newScale;
        updateScale(newScale);
        updatePosition(newX, newY);
      }, 100);
    }
  };

  const applyZoomFromInput = () => {
    const value = parseFloat(zoomInput);
    if (!isNaN(value) && value > 0) {
      const clampedValue = Math.max(10, Math.min(300, value));
      const newScale = clampedValue / 100;
      const centerX = viewportWidth / 2;
      const centerY = viewportHeight / 2;
      const currentCenterX = (centerX - stagePosition.x) / stageScale;
      const currentCenterY = (centerY - stagePosition.y) / stageScale;
      const newX = centerX - currentCenterX * newScale;
      const newY = centerY - currentCenterY * newScale;
      updateScale(newScale);
      updatePosition(newX, newY);
      setZoomInput(clampedValue.toString());
    } else {
      setZoomInput(Math.round(stageScale * 100).toString());
    }
  };

  const handleZoomInputSubmit = (e: React.KeyboardEvent | React.FormEvent) => {
    e.preventDefault();
    applyZoomFromInput();
  };

  const handleZoomInputBlur = () => {
    applyZoomFromInput();
  };

  const handlePanXInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanXInput(e.target.value);
  };

  const handlePanYInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPanYInput(e.target.value);
  };

  const handlePanXSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(panXInput);
    if (!isNaN(value)) {
      const clampedX = Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, value));
      updatePosition(clampedX, stagePosition.y);
    } else {
      setPanXInput(Math.round(stagePosition.x).toString());
    }
  };

  const handlePanYSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(panYInput);
    if (!isNaN(value)) {
      const clampedY = Math.max(-CANVAS_HALF, Math.min(CANVAS_HALF, value));
      updatePosition(stagePosition.x, clampedY);
    } else {
      setPanYInput(Math.round(stagePosition.y).toString());
    }
  };

  const handlePanXBlur = () => {
    const value = parseFloat(panXInput);
    if (isNaN(value)) {
      setPanXInput(Math.round(stagePosition.x).toString());
    }
  };

  const handlePanYBlur = () => {
    const value = parseFloat(panYInput);
    if (isNaN(value)) {
      setPanYInput(Math.round(stagePosition.y).toString());
    }
  };

  return (
    <div className="space-y-4">
      {/* Zoom Controls */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Zoom</label>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom Out"
          >
            −
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Zoom In"
          >
            +
          </button>
          <div className="flex items-center">
            <input
              type="number"
              value={zoomInput}
              onChange={handleZoomInputChange}
              onBlur={handleZoomInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleZoomInputSubmit(e);
                }
              }}
              className="w-16 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="10"
              max="300"
              step="1"
              title="Enter zoom percentage (10-300%)"
            />
            <span className="ml-1 text-sm text-gray-600">%</span>
          </div>
        </div>
      </div>

      {/* Pan Controls */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Pan Position</label>
        <div className="space-y-2">
          <form onSubmit={handlePanXSubmit} className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-4">X:</label>
            <input
              type="number"
              value={panXInput}
              onChange={handlePanXInputChange}
              onBlur={handlePanXBlur}
              className="flex-1 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pan X coordinate"
            />
          </form>
          <form onSubmit={handlePanYSubmit} className="flex items-center gap-2">
            <label className="text-xs text-gray-500 w-4">Y:</label>
            <input
              type="number"
              value={panYInput}
              onChange={handlePanYInputChange}
              onBlur={handlePanYBlur}
              className="flex-1 px-2 py-1 text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Pan Y coordinate"
            />
          </form>
        </div>
      </div>

      {/* View Controls */}
      <div className="space-y-2">
        <button
          onClick={handleResetView}
          className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
          title="Reset View"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};

export default CanvasControls;
