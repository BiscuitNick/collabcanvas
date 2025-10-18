
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { CANVAS_ID } from '../../lib/config';
import type { Content } from '../../types';
import { ContentVersion } from '../../types';
import { useCanvasStore } from '../../store/canvasStore';

// Custom hook to track localStorage changes for enableFirestore
const useFirestoreEnabled = () => {
  const [enabled, setEnabled] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    return stored ? JSON.parse(stored) : true;
  });

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'enableFirestore' && e.newValue !== null) {
        setEnabled(JSON.parse(e.newValue));
      }
    };

    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically for same-tab changes
    const interval = setInterval(() => {
      const stored = localStorage.getItem('enableFirestore');
      const current = stored ? JSON.parse(stored) : true;
      if (current !== enabled) {
        setEnabled(current);
      }
    }, 500);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [enabled]);

  return enabled;
};

export const useFirestoreSync = (userUid: string | undefined) => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentStateRef = useRef<Content[]>([]);
  const activelyEditingRef = useRef<Set<string>>(new Set());
  const isCreatingContent = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enableFirestore = useFirestoreEnabled();

  // Get canvas store content - used when Firestore is disabled
  const storeContent = useCanvasStore((state) => state.content);

  useEffect(() => {
    contentStateRef.current = content;
  }, [content]);

  // When Firestore is disabled, sync with canvas store
  useEffect(() => {
    if (!enableFirestore && userUid) {
      setContent(storeContent);
    }
  }, [storeContent, enableFirestore, userUid]);

  useEffect(() => {
    if (!userUid) {
      setContent([]);
      setLoading(false);
      return;
    }

    // If Firestore is disabled, use canvas store as source of truth
    if (!enableFirestore) {
      console.log('🔌 Firestore disabled - using canvas store');
      setContent(storeContent);
      setLoading(false);
      return;
    }

    console.log('🔌 Firestore enabled - setting up listener');
    const contentRef = collection(firestore, 'canvases', CANVAS_ID, 'content');
    const q = query(contentRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contentData: Content[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();

          // Common fields for all content types
          const baseContent = {
            id: doc.id,
            version: data.version || ContentVersion.V1,
            x: data.x,
            y: data.y,
            rotation: data.rotation || 0,
            createdBy: data.createdBy,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            lockedByUserId: data.lockedByUserId || null,
            lockedByUserName: data.lockedByUserName || null,
            lockedByUserColor: data.lockedByUserColor || null,
            lockedAt: data.lockedAt || null,
            syncStatus: 'synced' as const,
          };

          if (data.type === 'rectangle') {
            contentData.push({
              ...baseContent,
              type: 'rectangle',
              width: data.width,
              height: data.height,
              cornerRadius: data.cornerRadius,
              fill: data.fill,
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
            });
          } else if (data.type === 'circle') {
            contentData.push({
              ...baseContent,
              type: 'circle',
              radius: data.radius,
              fill: data.fill,
              stroke: data.stroke,
              strokeWidth: data.strokeWidth,
            });
          } else if (data.type === 'text') {
            contentData.push({
              ...baseContent,
              type: 'text',
              text: data.text || '',
              fontSize: data.fontSize || 24,
              fontFamily: data.fontFamily || 'Arial',
              fontStyle: data.fontStyle || 'normal',
              fill: data.fill || '#000000',
              textAlign: data.textAlign || 'left',
              verticalAlign: data.verticalAlign || 'top',
              width: data.width,
              height: data.height,
              opacity: data.opacity !== undefined ? data.opacity : 1,
            });
          } else if (data.type === 'image') {
            contentData.push({
              ...baseContent,
              type: 'image',
              src: data.src,
              width: data.width,
              height: data.height,
              alt: data.alt,
            });
          }
        });

        // Merge remote content with local-only content
        // Preserve local-only items (those with IDs starting with "local-")
        const localOnlyItems = contentStateRef.current.filter(c => c.id.startsWith('local-'));

        // Merge: prioritize local state for actively editing items, add local-only items
        const mergedContent = [
          ...contentData.map((remoteContent) => {
            const local = contentStateRef.current.find((c) => c.id === remoteContent.id);
            const isActivelyEditing = activelyEditingRef.current.has(remoteContent.id);
            if (isActivelyEditing && local) {
              return local;
            }
            return remoteContent;
          }),
          ...localOnlyItems
        ];

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          setContent(mergedContent);
          setLoading(false);
          setError(null);
        }, isCreatingContent.current ? 100 : 0);
      },
      (err) => {
        console.error('Error listening to content:', err);
        setError('Failed to sync content');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [userUid, enableFirestore]);

  return { content, setContent, loading, error, activelyEditingRef, isCreatingContent };
};
