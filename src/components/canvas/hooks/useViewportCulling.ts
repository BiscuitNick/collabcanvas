
import { useMemo, useCallback, useEffect } from 'react';
import { useCanvasStore } from '../../../store/canvasStore';
import type { Content } from '../../../types';

interface ViewportCullingProps {
  content: Content[];
  width: number;
  height: number;
  enableViewportCulling?: boolean;
  onVisibleShapesChange?: (visibleCount: number) => void;
}

export const useViewportCulling = ({
  content,
  width,
  height,
  enableViewportCulling = true,
  onVisibleShapesChange,
}: ViewportCullingProps) => {
  const { stagePosition, stageScale } = useCanvasStore();

  const getVisibleShapes = useCallback(
    (shapesToFilter: Content[]) => {
      if (!enableViewportCulling) return shapesToFilter;

      const viewportBounds = {
        left: -stagePosition.x / stageScale,
        top: -stagePosition.y / stageScale,
        right: (-stagePosition.x + width) / stageScale,
        bottom: (-stagePosition.y + height) / stageScale,
      };

      const padding = 500 / stageScale;

      return shapesToFilter.filter((shape) => {
        let shapeWidth: number;
        let shapeHeight: number;

        if ('width' in shape && 'height' in shape && shape.width !== undefined && shape.height !== undefined) {
          shapeWidth = shape.width;
          shapeHeight = shape.height;
        } else if ('radius' in shape && shape.radius !== undefined) {
          shapeWidth = shape.radius * 2;
          shapeHeight = shape.radius * 2;
        } else {
          shapeWidth = 100;
          shapeHeight = 100;
        }

        return !(
          shape.x + shapeWidth < viewportBounds.left - padding ||
          shape.x > viewportBounds.right + padding ||
          shape.y + shapeHeight < viewportBounds.top - padding ||
          shape.y > viewportBounds.bottom + padding
        );
      });
    },
    [stagePosition.x, stagePosition.y, stageScale, width, height, enableViewportCulling]
  );

  const visibleShapes = useMemo(() => {
    return getVisibleShapes(content);
  }, [content, getVisibleShapes]);

  useEffect(() => {
    if (onVisibleShapesChange) {
      onVisibleShapesChange(visibleShapes.length);
    }
  }, [visibleShapes.length, onVisibleShapesChange]);

  return visibleShapes;
};
