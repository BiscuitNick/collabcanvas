
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, doc } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasId } from '../../contexts/CanvasContext';
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
  const canvasId = useCanvasId();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contentIds, setContentIds] = useState<string[]>([]);
  const contentStateRef = useRef<Content[]>([]);
  const activelyEditingRef = useRef<Set<string>>(new Set());
  const isCreatingContent = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const enableFirestore = useFirestoreEnabled();

  // Get canvas store content and setContent action
  const storeContent = useCanvasStore((state) => state.content);
  const setStoreContent = useCanvasStore((state) => state.setContent);

  // Keep a ref to the latest store content for use in callbacks
  const storeContentRef = useRef<Content[]>(storeContent);
  useEffect(() => {
    storeContentRef.current = storeContent;
  }, [storeContent]);

  useEffect(() => {
    contentStateRef.current = content;
  }, [content]);

  // Get the setContentIds function from the store
  const setStoreContentIds = useCanvasStore((state) => state.setContentIds);

  // Listen to canvas document for contentIds ordering
  useEffect(() => {
    if (!userUid || !enableFirestore) {
      return;
    }

    const canvasRef = doc(firestore, 'canvases', canvasId);
    const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const firestoreContentIds = data.contentIds || [];
        setContentIds(firestoreContentIds);
        // Also update the store's contentIds directly from Firestore
        setStoreContentIds(firestoreContentIds);
        console.log('📥 [FIRESTORE SYNC] Received canvas document from Firestore:', {
          contentIds: firestoreContentIds,
          contentIdsLastEditedBy: data.contentIdsLastEditedBy || null,
          contentIdsLastEditedAt: data.contentIdsLastEditedAt || null
        });
      }
    });

    return () => unsubscribe();
  }, [userUid, enableFirestore, canvasId, setStoreContentIds]);

  // When Firestore is disabled, sync with canvas store
  useEffect(() => {
    if (!enableFirestore && userUid) {
      setContent(storeContent);
      // Store already has the content, no need to set it again
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
      setContent(storeContent);
      // Store already has the content, no need to set it again
      setLoading(false);
      return;
    }

    const contentRef = collection(firestore, 'canvases', canvasId, 'content');
    const q = query(contentRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log(`🔥 [FIRESTORE] Received update with ${snapshot.size} documents`);

        const contentData: Content[] = [];
        const deletedIds: string[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();

          // Skip deleted items - filter them out from sync
          // This handles soft deletes propagating to all users
          if (data.deleted === true) {
            deletedIds.push(doc.id);
            return;
          }

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
            lastEditedBy: data.lastEditedBy || null,
            lastEditedAt: data.lastEditedAt || null,
            deleted: data.deleted || false,
            deletedBy: data.deletedBy || null,
            deletedAt: data.deletedAt || null,
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
              src: data.src || '',
              width: data.width || 100,
              height: data.height || 100,
              alt: data.alt || 'Image',
              opacity: data.opacity !== undefined ? data.opacity : 1,
            });
          } else if (data.type === 'group') {
            contentData.push({
              ...baseContent,
              type: 'group',
              width: data.width || 200,
              height: data.height || 200,
              scaleX: data.scaleX || 1,
              scaleY: data.scaleY || 1,
              contentIds: data.contentIds || [],
              contentData: data.contentData || {},
              opacity: data.opacity !== undefined ? data.opacity : 1,
            });
          }
        });

        console.log(`🔥 [FIRESTORE] Content from Firestore:`, contentData.map(c => {
          const info: any = {
            id: c.id,
            type: c.type,
            lastEditedBy: c.lastEditedBy,
            x: Math.round(c.x),
            y: Math.round(c.y)
          }
          // Show contentIds array for groups
          if (c.type === 'group' && (c as any).contentIds) {
            info.contentIds = (c as any).contentIds
            info.nestedCount = (c as any).contentIds.length
          }
          return info
        }));
        console.log(`🔢 [FIRESTORE] Canvas contentIds (z-index order):`, contentIds);

        // Get current store content for comparison from ref
        const currentStoreContent = storeContentRef.current;

        // Create a map of current store content for quick lookup
        const storeContentMap = new Map(currentStoreContent.map(c => [c.id, c]));

        // Build the merged content array
        const mergedContent: Content[] = [];

        // Process remote content
        contentData.forEach((remoteContent) => {
          const isActivelyEditing = activelyEditingRef.current.has(remoteContent.id);
          const storeItem = storeContentMap.get(remoteContent.id);
          const wasLastEditedByCurrentUser = remoteContent.lastEditedBy === userUid;

          if (isActivelyEditing && storeItem) {
            // User is actively editing this item - keep their local changes
            mergedContent.push(storeItem);
          } else if (wasLastEditedByCurrentUser && storeItem) {
            // Current user was the last to edit - use local version
            mergedContent.push(storeItem);
          } else {
            // Not editing and not our edit - use remote content (this updates other users' changes)
            mergedContent.push(remoteContent);
          }

          // Remove from map to track what's been processed
          storeContentMap.delete(remoteContent.id);
        });

        // Add any remaining local-only items (those not in Firestore)
        // But exclude any that were marked as deleted
        storeContentMap.forEach((localItem) => {
          if ((localItem.id.startsWith('local-') || localItem.id.startsWith('hardcoded-')) && !deletedIds.includes(localItem.id)) {
            mergedContent.push(localItem);
          }
        });

        // Order content based on contentIds (z-index)
        const orderedContent: Content[] = [];
        const contentMap = new Map(mergedContent.map(c => [c.id, c]));

        // Add content in the order specified by contentIds
        contentIds.forEach(id => {
          const item = contentMap.get(id);
          if (item) {
            orderedContent.push(item);
            contentMap.delete(id);
          }
        });

        // Add any remaining items not in contentIds (new items)
        contentMap.forEach(item => {
          orderedContent.push(item);
        });

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          setContent(orderedContent);
          setStoreContent(orderedContent); // Update Zustand store with ordered content
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
  }, [userUid, enableFirestore, setStoreContent, canvasId]); // Note: storeContent is read inside but not a dependency to avoid infinite loops

  return { content, setContent, loading, error, activelyEditingRef, isCreatingContent };
};
