import { useRef, useEffect } from 'react';
import Konva from 'konva';

interface UseSmoothPanningProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  targetX: number;
  targetY: number;
  duration?: number; // milliseconds
  isUserDragging?: boolean; // True when user is actively dragging/panning
  isZooming?: boolean; // True when user is actively zooming
}

const ANIMATION_DURATION = 300; // Default 300ms for smooth panning
const EASING_FUNCTION = (t: number): number => {
  // Easing out cubic for smooth deceleration
  return 1 - Math.pow(1 - t, 3);
};

export const useSmoothPanning = ({
  stageRef,
  targetX,
  targetY,
  duration = ANIMATION_DURATION,
  isUserDragging = false,
  isZooming = false,
}: UseSmoothPanningProps) => {
  const animationFrameRef = useRef<number | null>(null);
  const lastTargetRef = useRef<{ x: number; y: number }>({ x: targetX, y: targetY });
  const initializedRef = useRef(false);

  // Initialize stage position on mount
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || initializedRef.current) {
      return;
    }
    initializedRef.current = true;
    stage.x(targetX);
    stage.y(targetY);
    stage.draw();
  }, [stageRef, targetX, targetY]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) {
      return;
    }

    if (isUserDragging || isZooming) {
      // Cancel animation if user starts dragging or zooming
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      lastTargetRef.current = { x: targetX, y: targetY };
      return;
    }

    const currentX = stage.x();
    const currentY = stage.y();

    // If target hasn't changed, just ensure we're at the target position
    if (lastTargetRef.current.x === targetX && lastTargetRef.current.y === targetY &&
        currentX === targetX && currentY === targetY) {
      return;
    }

    // Only animate if position actually changed and target is different
    if (currentX !== targetX || currentY !== targetY ||
        lastTargetRef.current.x !== targetX || lastTargetRef.current.y !== targetY) {
      // Cancel any ongoing animation
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      const startX = currentX;
      const startY = currentY;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = EASING_FUNCTION(progress);

        // Interpolate position
        const animX = startX + (targetX - startX) * easedProgress;
        const animY = startY + (targetY - startY) * easedProgress;

        stage.x(animX);
        stage.y(animY);
        stage.draw();

        // Continue animation if not finished
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure we end exactly at target position
          stage.x(targetX);
          stage.y(targetY);
          stage.draw();
          animationFrameRef.current = null;
        }
      };

      animationFrameRef.current = requestAnimationFrame(animate);
      lastTargetRef.current = { x: targetX, y: targetY };
    }

    return () => {
      // Cleanup is handled by the dependency array changes
    };
  }, [stageRef, targetX, targetY, isUserDragging, isZooming, duration]);
};
