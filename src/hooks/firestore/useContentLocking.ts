
import { useCallback, useEffect, useRef } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { useCanvasId } from '../../contexts/CanvasContext';
import { LOCK_TTL_MS } from '../../lib/config';
import { useAuth } from '../useAuth';
import { getUserColor } from '../../lib/utils';
import type { Content } from '../../types';

export const useContentLocking = (content: Content[]) => {
  const canvasId = useCanvasId();
  const { user } = useAuth();
  const { updateContent: updateStoreContent } = useCanvasStore();
  const lockCleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const lockContent = useCallback(async (id: string): Promise<void> => {
    if (!user) return;
    try {
      const userColor = getUserColor(user.uid);
      updateStoreContent(id, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: Date.now(),
      });
      const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
      await updateDoc(contentRef, {
        lockedByUserId: user.uid,
        lockedByUserName: user.displayName || 'User',
        lockedByUserColor: userColor,
        lockedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error locking content:', err);
    }
  }, [user, updateStoreContent, canvasId]);

  const unlockContent = useCallback(async (id: string): Promise<void> => {
    try {
      updateStoreContent(id, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      });
      const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
      await updateDoc(contentRef, {
        lockedByUserId: null,
        lockedByUserName: null,
        lockedByUserColor: null,
        lockedAt: null,
      });
    } catch (err) {
      console.error('Error unlocking content:', err);
    }
  }, [updateStoreContent, canvasId]);

  useEffect(() => {
    const cleanupStaleLocks = () => {
      const now = Date.now();
      const staleContent: string[] = [];
      content.forEach((content) => {
        if (content.lockedByUserId && content.lockedAt) {
          const lockTime = typeof content.lockedAt === 'number' ? content.lockedAt : content.lockedAt.getTime();
          if (now - lockTime > LOCK_TTL_MS) {
            staleContent.push(content.id);
          }
        }
      });
      staleContent.forEach((contentId) => {
        updateStoreContent(contentId, {
          lockedByUserId: null,
          lockedByUserName: null,
          lockedByUserColor: null,
          lockedAt: null,
        });
        const contentRef = doc(firestore, 'canvases', canvasId, 'content', contentId);
        updateDoc(contentRef, {
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
  }, [content, updateStoreContent, canvasId]);

  return { lockContent, unlockContent };
};
