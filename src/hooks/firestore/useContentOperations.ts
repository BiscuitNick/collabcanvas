
import { useCallback, useRef, useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING, CANVAS_ID } from '../../lib/config';
import type { Content } from '../../types';

// Remove undefined values from an object for Firestore compatibility
const removeUndefinedValues = (obj: any): any => {
  const result: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

export const useContentOperations = (
  content: Content[],
  _setContent: React.Dispatch<React.SetStateAction<Content[]>>, // Not used anymore - canvas store is source of truth
  activelyEditingRef: React.MutableRefObject<Set<string>>,
  isCreatingContent: React.MutableRefObject<boolean>
) => {
  const { addContent: addStoreContent, updateContent: updateStoreContent, deleteContent: deleteStoreContent, setSyncStatus, clearAllContent: clearAllContentStore } = useCanvasStore();
  const retryCount = useRef(0);

  // Track Firestore enabled state
  const [enableFirestore, setEnableFirestore] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    const value = stored ? JSON.parse(stored) : true;
    console.log('🔍 useContentOperations initial enableFirestore:', value, 'from localStorage:', stored);
    return value;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('enableFirestore');
      const current = stored ? JSON.parse(stored) : true;
      if (current !== enableFirestore) {
        console.log('🔍 useContentOperations enableFirestore changed:', enableFirestore, '->', current);
        setEnableFirestore(current);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [enableFirestore]);

  const throttledUpdate = useCallback(async (id: string, updates: Partial<Content>) => {
    try {
      const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', id);
      const updateData = removeUndefinedValues({ ...updates, updatedAt: serverTimestamp() });
      await updateDoc(contentRef, updateData);
      setSyncStatus(id, 'synced');
      retryCount.current = 0;
    } catch (err) {
      console.error('Error updating content:', err);
      setSyncStatus(id, 'error');
      if (retryCount.current < SHAPE_MAX_RETRIES) {
        retryCount.current++;
        const retryDelay = SHAPE_RETRY_DELAY_MS * retryCount.current;
        setTimeout(() => throttledUpdate(id, updates), retryDelay);
        if (ENABLE_PERFORMANCE_LOGGING) {
          console.log(`🔄 Content update retry ${retryCount.current}/${SHAPE_MAX_RETRIES} in ${retryDelay}ms`);
        }
      }
    }
  }, [setSyncStatus]);

  const createContent = useCallback(async (contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>, skipFirestore = false): Promise<void> => {
    try {
      isCreatingContent.current = true;

      console.log('🔍 createContent called:', { skipFirestore, willUseFirestore: !skipFirestore });

      // Use local-only mode if skipFirestore is true
      if (skipFirestore) {
        // Local-only mode: Add to canvas store with local ID
        const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date();
        const localContent: Content = {
          ...contentData,
          id: localId,
          createdAt: now,
          updatedAt: now,
        } as Content;
        addStoreContent(localContent);
        console.log('⚠️ Content added to canvas store only:', localId);
      } else {
        // Firestore mode: Add to Firestore, listener will update local state
        const path = `canvases/${CANVAS_ID}/content`;
        console.log('📤 Firestore path:', path);
        const contentRef = collection(firestore, 'canvases', CANVAS_ID, 'content');
        const now = serverTimestamp();
        const newContent = removeUndefinedValues({ ...contentData, createdAt: now, updatedAt: now });
        console.log('📤 About to add to Firestore:', newContent);
        const docRef = await addDoc(contentRef, newContent);
        console.log('✅ Content added to Firestore with ID:', docRef.id);
        console.log('✅ Full Firestore path:', docRef.path);
        setSyncStatus(docRef.id, 'pending');
      }
    } catch (err) {
      console.error('❌ Error creating content:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
    } finally {
      setTimeout(() => {
        isCreatingContent.current = false;
      }, 100);
    }
  }, [setSyncStatus, isCreatingContent, addStoreContent]);

  const updateContent = useCallback(async (id: string, updates: Partial<Content>): Promise<void> => {
    try {
      // Mark as actively editing and refresh the timeout
      activelyEditingRef.current.add(id);

      // Update the local store immediately for instant UI feedback
      console.log('✏️ Updating local store for', id, updates);
      updateStoreContent(id, updates);

      // Clear any existing timeout for this content
      if ((window as any)[`editTimeout_${id}`]) {
        clearTimeout((window as any)[`editTimeout_${id}`]);
      }

      // Set a new timeout to clear the editing state after 2 seconds of inactivity
      (window as any)[`editTimeout_${id}`] = setTimeout(() => {
        activelyEditingRef.current.delete(id);
        delete (window as any)[`editTimeout_${id}`];
      }, 2000);

      // Only update Firestore if enabled
      if (enableFirestore) {
        setSyncStatus(id, 'pending');
        throttledUpdate(id, updates);
      } else {
        console.log('⚠️ Content updated in canvas store only:', id);
      }
    } catch (err) {
      console.error('Error updating content:', err);
      if (enableFirestore) {
        setSyncStatus(id, 'error');
      }
    }
  }, [updateStoreContent, setSyncStatus, throttledUpdate, activelyEditingRef, enableFirestore]);

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    try {
      deleteStoreContent(id);

      // Only delete from Firestore if enabled and not a local-only item
      if (enableFirestore && !id.startsWith('local-')) {
        const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', id);
        await deleteDoc(contentRef);
        console.log('✅ Content deleted from Firestore:', id);
      } else {
        console.log('⚠️ Content deleted from canvas store only:', id);
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  }, [deleteStoreContent, enableFirestore]);

  const clearAllContent = useCallback(async (): Promise<void> => {
    try {
      const currentContent = content;
      clearAllContentStore();

      // Only delete from Firestore if enabled
      if (enableFirestore) {
        const deletePromises = currentContent
          .filter(c => !c.id.startsWith('local-')) // Don't try to delete local-only items from Firestore
          .map((content) => {
            const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', content.id);
            return deleteDoc(contentRef);
          });
        await Promise.all(deletePromises);
        console.log('✅ All content cleared from Firestore');
      } else {
        console.log('⚠️ All content cleared from canvas store only');
      }
    } catch (err) {
      console.error('Error clearing all content:', err);
    }
  }, [content, clearAllContentStore, enableFirestore]);

  const startEditingContent = useCallback((id: string): void => {
    activelyEditingRef.current.add(id);
    setTimeout(() => {
      if (activelyEditingRef.current.has(id)) {
        activelyEditingRef.current.delete(id);
      }
    }, 5000);
  }, [activelyEditingRef]);

  const stopEditingContent = useCallback((id: string): void => {
    activelyEditingRef.current.delete(id);
  }, [activelyEditingRef]);

  return { createContent, updateContent, deleteContent, clearAllContent, startEditingContent, stopEditingContent };
};
