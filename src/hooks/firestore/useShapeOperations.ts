
import { useCallback, useRef } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING, CANVAS_ID } from '../../lib/config';
import type { Content } from '../../types';

export const useContentOperations = (content: Content[], activelyEditingRef: React.MutableRefObject<Set<string>>, isCreatingContent: React.MutableRefObject<boolean>) => {
  const { updateContent: updateStoreContent, deleteContent: deleteStoreContent, setSyncStatus, clearAllContent: clearAllContentStore } = useCanvasStore();
  const retryCount = useRef(0);

  const throttledUpdate = useCallback(async (id: string, updates: Partial<Content>) => {
    try {
      const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', id);
      const updateData = { ...updates, updatedAt: serverTimestamp() };
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

  const createContent = useCallback(async (contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      isCreatingContent.current = true;
      const contentRef = collection(firestore, 'canvases', CANVAS_ID, 'content');
      const now = serverTimestamp();
      const newContent = { ...contentData, createdAt: now, updatedAt: now };
      const docRef = await addDoc(contentRef, newContent);
      setSyncStatus(docRef.id, 'pending');
    } catch (err) {
      console.error('Error creating content:', err);
    } finally {
      setTimeout(() => {
        isCreatingContent.current = false;
      }, 100);
    }
  }, [setSyncStatus, isCreatingContent]);

  const updateContent = useCallback(async (id: string, updates: Partial<Content>): Promise<void> => {
    try {
      activelyEditingRef.current.add(id);
      updateStoreContent(id, updates);
      setSyncStatus(id, 'pending');
      throttledUpdate(id, updates);
    } catch (err) {
      console.error('Error updating content:', err);
      setSyncStatus(id, 'error');
    }
  }, [updateStoreContent, setSyncStatus, throttledUpdate, activelyEditingRef]);

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    try {
      const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', id);
      deleteStoreContent(id);
      await deleteDoc(contentRef);
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  }, [deleteStoreContent]);

  const clearAllContent = useCallback(async (): Promise<void> => {
    try {
      const currentContent = content;
      clearAllContentStore();
      const deletePromises = currentContent.map((content) => {
        const contentRef = doc(firestore, 'canvases', CANVAS_ID, 'content', content.id);
        return deleteDoc(contentRef);
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing all content:', err);
    }
  }, [content, clearAllContentStore]);

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
