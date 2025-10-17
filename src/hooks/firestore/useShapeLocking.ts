
import { useCallback, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { CANVAS_ID, LOCK_TTL_MS } from '../../lib/config';
import { useAuth } from '../useAuth';
import { getUserColor } from '../../lib/utils';
import type { Shape } from '../../types';

export const useShapeLocking = (shapes: Shape[]) => {
  const { user } = useAuth();
  const { updateShape: updateStoreShape } = useCanvasStore();
  const lockCleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lockShape = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    try {
      const userColor = getUserColor(user.uid);
      updateStoreShape(id, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: Date.now(),
      });
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id);
      await updateDoc(shapeRef, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error locking shape:', err);
    }
  }, [user, updateStoreShape]);

  const unlockShape = useCallback(async (id: string): Promise<void> => {
    try {
      updateStoreShape(id, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      });
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id);
      await updateDoc(shapeRef, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      });
    } catch (err) {
      console.error('Error unlocking shape:', err);
    }
  }, [updateStoreShape]);

  useEffect(() => {
    const cleanupStaleLocks = () => {
      const now = Date.now();
      const staleShapes: string[] = [];
      shapes.forEach((shape) => {
        if (shape.lockedByUserId && shape.lockedAt) {
          const lockTime = typeof shape.lockedAt === 'number' ? shape.lockedAt : shape.lockedAt.getTime();
          if (now - lockTime > LOCK_TTL_MS) {
            staleShapes.push(shape.id);
          }
        }
      });
      staleShapes.forEach((shapeId) => {
        updateStoreShape(shapeId, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        });
        const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', shapeId);
        updateDoc(shapeRef, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        }).catch(() => {
          // Silent cleanup
        });
      });
    };
    lockCleanupIntervalRef.current = setInterval(cleanupStaleLocks, 10000);
    return () => {
      if (lockCleanupIntervalRef.current) {
        clearInterval(lockCleanupIntervalRef.current);
      }
    };
  }, [shapes, updateStoreShape]);

  return { lockShape, unlockShape };
};
