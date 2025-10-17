
import React from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import { useAuth } from '../../../hooks/useAuth';
import { getRandomColor, getViewportCenter } from '../../../lib/utils';
import { ShapeType, ShapeVersion } from '../../../types';
import type { Rectangle } from '../../../types';

interface ShapeControlsProps {
  viewportWidth: number;
  viewportHeight: number;
  createShape: (shape: Omit<Rectangle, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteShape: (id: string) => Promise<void>;
  clearAllShapes: () => Promise<void>;
  shapes: Rectangle[];
  onShapeSelect?: (shapeId: string) => void;
}

const ShapeControls: React.FC<ShapeControlsProps> = ({
  viewportWidth,
  viewportHeight,
  createShape,
  deleteShape,
  clearAllShapes,
  shapes,
  onShapeSelect,
}) => {
  const { user } = useAuth();
  const { stageScale, stagePosition, selectedShapeId, resetView } = useCanvasStore();

  const handleCreateRectangle = async () => {
    if (!user) return;

    try {
      const center = getViewportCenter(stagePosition, stageScale, viewportWidth, viewportHeight);
      const newRectangleData = {
        type: ShapeType.RECTANGLE,
        version: ShapeVersion.V2,
        x: center.x - 50,
        y: center.y - 40,
        width: 100,
        height: 80,
        rotation: 0,
        fill: getRandomColor(),
        createdBy: user.uid,
      };
      await createShape(newRectangleData);
    } catch (error) {
      console.error('Error creating rectangle:', error);
    }
  };

  const handleDeleteRectangle = async () => {
    if (selectedShapeId) {
      if (window.confirm('Are you sure you want to delete this rectangle?')) {
        try {
          await deleteShape(selectedShapeId);
        } catch (error) {
          console.error('Error deleting rectangle:', error);
        }
      }
    }
  };

  const handleResetCanvas = async () => {
    if (window.confirm('Are you sure you want to reset the canvas? This will delete all shapes and reset the view.')) {
      try {
        await clearAllShapes();
        resetView();
      } catch (error) {
        console.error('Error resetting canvas:', error);
      }
    }
  };

  const handleShapeSelect = (shapeId: string) => {
    if (onShapeSelect) {
      onShapeSelect(shapeId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <button
          onClick={handleCreateRectangle}
          className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          title="Add Rectangle"
        >
          + Add Rectangle
        </button>
        {selectedShapeId && (
          <button
            onClick={handleDeleteRectangle}
            className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            title="Delete Selected Rectangle"
          >
            Delete Selected
          </button>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">All Shapes ({shapes.length})</h4>
        {shapes.length === 0 ? (
          <div className="text-xs text-gray-500 italic">No shapes created yet</div>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {shapes.map((shape) => (
              <button
                key={shape.id}
                onClick={() => handleShapeSelect(shape.id)}
                className={`w-full text-left p-2 rounded text-xs transition-colors ${
                  selectedShapeId === shape.id
                    ? 'bg-blue-100 border border-blue-300 text-blue-800'
                    : 'bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded border"
                    style={{
                      backgroundColor: shape.fill,
                      borderColor: selectedShapeId === shape.id ? '#3b82f6' : '#d1d5db',
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">Rectangle {shapes.indexOf(shape) + 1}</div>
                    <div className="text-gray-500 text-xs">
                      {Math.round(shape.x)}, {Math.round(shape.y)} • {Math.round(shape.width)}×
                      {Math.round(shape.height)}
                    </div>
                  </div>
                  {selectedShapeId === shape.id && <div className="text-blue-600">✓</div>}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <button
          onClick={handleResetCanvas}
          className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
          title="Reset Canvas - Delete all shapes and reset view"
        >
          Reset Canvas
        </button>
      </div>
    </div>
  );
};

export default ShapeControls;
