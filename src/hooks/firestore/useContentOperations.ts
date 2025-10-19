
import { useCallback, useRef, useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { useCanvasId, useCanEdit } from '../../contexts/CanvasContext';
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING } from '../../lib/config';
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
  isCreatingContent: React.MutableRefObject<boolean>,
  userUid: string | undefined
) => {
  const canvasId = useCanvasId();
  const canEdit = useCanEdit();
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
      const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
      const updateData = removeUndefinedValues({
        ...updates,
        updatedAt: serverTimestamp(),
        lastEditedBy: userUid || null,
        lastEditedAt: serverTimestamp()
      });
      console.log(`📝 [EDIT TRACKING] Updating content ${id} with lastEditedBy: ${userUid}`);
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
  }, [setSyncStatus, canvasId, userUid]);

  const createContent = useCallback(async (contentData: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>, skipFirestore = false): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot create content: No edit permission');
      return;
    }

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
          lastEditedBy: userUid || null,
          lastEditedAt: now,
        } as Content;
        addStoreContent(localContent);
        console.log(`⚠️ [EDIT TRACKING] Content added to canvas store only: ${localId}, lastEditedBy: ${userUid}`);
      } else {
        // Firestore mode: Add to Firestore, listener will update local state
        const path = `canvases/${canvasId}/content`;
        console.log('📤 Firestore path:', path);
        const contentRef = collection(firestore, 'canvases', canvasId, 'content');
        const now = serverTimestamp();
        const newContent = removeUndefinedValues({
          ...contentData,
          createdAt: now,
          updatedAt: now,
          lastEditedBy: userUid || null,
          lastEditedAt: now
        });
        console.log(`📤 [EDIT TRACKING] About to add to Firestore with lastEditedBy: ${userUid}`, newContent);
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
  }, [setSyncStatus, isCreatingContent, addStoreContent, canvasId, canEdit]);

  const updateContent = useCallback(async (id: string, updates: Partial<Content>): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot update content: No edit permission');
      return;
    }

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
  }, [updateStoreContent, setSyncStatus, throttledUpdate, activelyEditingRef, enableFirestore, canEdit]);

  const deleteContent = useCallback(async (id: string): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot delete content: No edit permission');
      return;
    }

    try {
      console.log(`🗑️ [SOFT DELETE] Marking content as deleted ${id}, deletedBy: ${userUid}`);

      // Remove from local store immediately
      deleteStoreContent(id);

      // Mark as deleted in Firestore (soft delete) instead of removing the document
      // This ensures all connected users receive the delete update via the listener
      if (enableFirestore && !id.startsWith('local-')) {
        const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
        await updateDoc(contentRef, {
          deleted: true,
          deletedBy: userUid || null,
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log(`✅ [SOFT DELETE] Content marked as deleted in Firestore: ${id}, by user: ${userUid}`);
      } else {
        console.log(`⚠️ [SOFT DELETE] Content deleted from canvas store only: ${id}, by user: ${userUid}`);
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  }, [deleteStoreContent, enableFirestore, canvasId, canEdit, userUid]);

  const clearAllContent = useCallback(async (): Promise<void> => {
    try {
      const currentContent = content;
      const allIds = currentContent.map(c => c.id);

      clearAllContentStore();

      // Mark all as deleted in Firestore (soft delete) instead of removing documents
      // This ensures all connected users receive the delete updates via the listener
      if (enableFirestore && allIds.length > 0) {
        const batch = writeBatch(firestore);
        const firestoreIds = allIds.filter(id => !id.startsWith('local-'));

        firestoreIds.forEach(id => {
          const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
          batch.update(contentRef, {
            deleted: true,
            deletedBy: userUid || null,
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        if (firestoreIds.length > 0) {
          console.log(`📤 [CLEAR ALL - SOFT DELETE] Marking ${firestoreIds.length} items as deleted in Firestore with batch write`);
          await batch.commit();
          console.log('✅ All content marked as deleted in Firestore');
        }

        const localOnlyCount = allIds.length - firestoreIds.length;
        if (localOnlyCount > 0) {
          console.log(`⚠️ [CLEAR ALL] ${localOnlyCount} local-only items cleared from canvas store`);
        }
      } else {
        console.log('⚠️ All content cleared from canvas store only');
      }
    } catch (err) {
      console.error('Error clearing all content:', err);
    }
  }, [content, clearAllContentStore, enableFirestore, canvasId, userUid]);

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

  const updateContentBatch = useCallback(async (updatesList: Array<{ id: string; updates: Partial<Content> }>): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot update content batch: No edit permission');
      return;
    }

    if (updatesList.length === 0) {
      console.warn('⚠️ Empty update batch, skipping');
      return;
    }

    try {
      const startTime = performance.now();

      console.log(`📦 [BATCH UPDATE] Starting batch update of ${updatesList.length} items`);

      // Mark all as actively editing
      updatesList.forEach(({ id }) => {
        activelyEditingRef.current.add(id);
      });

      // Update local store immediately for all items
      updatesList.forEach(({ id, updates }) => {
        console.log('✏️ Updating local store for', id, updates);
        updateStoreContent(id, updates);
      });

      // Clear editing state after delay
      updatesList.forEach(({ id }) => {
        if ((window as any)[`editTimeout_${id}`]) {
          clearTimeout((window as any)[`editTimeout_${id}`]);
        }

        (window as any)[`editTimeout_${id}`] = setTimeout(() => {
          activelyEditingRef.current.delete(id);
          delete (window as any)[`editTimeout_${id}`];
        }, 2000);
      });

      // Only update Firestore if enabled
      if (enableFirestore) {
        const batch = writeBatch(firestore);

        updatesList.forEach(({ id, updates }) => {
          const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
          const updateData = removeUndefinedValues({
            ...updates,
            updatedAt: serverTimestamp(),
            lastEditedBy: userUid || null,
            lastEditedAt: serverTimestamp()
          });
          batch.update(contentRef, updateData);
          setSyncStatus(id, 'pending');
        });

        console.log(`📤 [BATCH UPDATE] Writing ${updatesList.length} updates to Firestore with batch write`);
        await batch.commit();

        // Set all items to synced status
        updatesList.forEach(({ id }) => setSyncStatus(id, 'synced'));

        const duration = performance.now() - startTime;
        console.log(`✅ [BATCH UPDATE] ${updatesList.length} items updated in Firestore in ${duration.toFixed(2)}ms`);
      } else {
        const duration = performance.now() - startTime;
        console.log(`⚠️ [BATCH UPDATE] ${updatesList.length} items updated in canvas store only in ${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      console.error('❌ Error updating content batch:', err);
      if (enableFirestore) {
        updatesList.forEach(({ id }) => setSyncStatus(id, 'error'));
      }
    }
  }, [updateStoreContent, setSyncStatus, activelyEditingRef, enableFirestore, canEdit, userUid, canvasId]);

  const deleteContentBatch = useCallback(async (ids: string[]): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot delete content batch: No edit permission');
      return;
    }

    if (ids.length === 0) {
      console.warn('⚠️ Empty delete batch, skipping');
      return;
    }

    try {
      const startTime = performance.now();

      console.log(`📦 [BATCH SOFT DELETE] Starting batch soft deletion of ${ids.length} items`);

      // Delete from local store immediately
      ids.forEach(id => {
        console.log(`🗑️ [SOFT DELETE] Marking content as deleted ${id}, deletedBy: ${userUid}`);
        deleteStoreContent(id);
      });

      // Mark as deleted in Firestore (soft delete) instead of removing documents
      // This ensures all connected users receive the delete updates via the listener
      if (enableFirestore) {
        const batch = writeBatch(firestore);
        const firestoreIds = ids.filter(id => !id.startsWith('local-'));

        firestoreIds.forEach(id => {
          const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
          batch.update(contentRef, {
            deleted: true,
            deletedBy: userUid || null,
            deletedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        });

        if (firestoreIds.length > 0) {
          console.log(`📤 [BATCH SOFT DELETE] Marking ${firestoreIds.length} items as deleted in Firestore with batch write`);
          await batch.commit();

          const duration = performance.now() - startTime;
          console.log(`✅ [BATCH SOFT DELETE] ${firestoreIds.length} items marked as deleted in Firestore in ${duration.toFixed(2)}ms`);
        }

        const localOnlyCount = ids.length - firestoreIds.length;
        if (localOnlyCount > 0) {
          console.log(`⚠️ [BATCH SOFT DELETE] ${localOnlyCount} local-only items deleted from canvas store`);
        }
      } else {
        const duration = performance.now() - startTime;
        console.log(`⚠️ [BATCH SOFT DELETE] ${ids.length} items deleted from canvas store only in ${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      console.error('❌ Error deleting content batch:', err);
    }
  }, [deleteStoreContent, enableFirestore, canvasId, canEdit, userUid]);

  const createContentBatch = useCallback(async (contentDataArray: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>[], skipFirestore = false): Promise<void> => {
    // Check edit permission
    if (!canEdit) {
      console.warn('⛔ Cannot create content batch: No edit permission');
      return;
    }

    if (contentDataArray.length === 0) {
      console.warn('⚠️ Empty content batch, skipping');
      return;
    }

    try {
      isCreatingContent.current = true;
      const startTime = performance.now();

      console.log(`📦 [BATCH CREATE] Starting batch creation of ${contentDataArray.length} items, skipFirestore: ${skipFirestore}`);

      if (skipFirestore) {
        // Local-only mode: Add all to canvas store with local IDs
        const localContent: Content[] = contentDataArray.map((contentData) => {
          const localId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const now = new Date();
          return {
            ...contentData,
            id: localId,
            createdAt: now,
            updatedAt: now,
            lastEditedBy: userUid || null,
            lastEditedAt: now,
          } as Content;
        });

        // Add all items to store at once
        localContent.forEach(item => addStoreContent(item));

        const duration = performance.now() - startTime;
        console.log(`✅ [BATCH CREATE] ${contentDataArray.length} items added to canvas store only in ${duration.toFixed(2)}ms`);
      } else {
        // Firestore mode: Use writeBatch for simultaneous writes
        const batch = writeBatch(firestore);
        const contentRef = collection(firestore, 'canvases', canvasId, 'content');
        const now = serverTimestamp();
        const docRefs: string[] = [];

        contentDataArray.forEach((contentData) => {
          const newDocRef = doc(contentRef);
          const newContent = removeUndefinedValues({
            ...contentData,
            createdAt: now,
            updatedAt: now,
            lastEditedBy: userUid || null,
            lastEditedAt: now
          });
          batch.set(newDocRef, newContent);
          docRefs.push(newDocRef.id);
        });

        console.log(`📤 [BATCH CREATE] Writing ${contentDataArray.length} items to Firestore with batch write`);
        await batch.commit();

        // Set all items to pending sync status
        docRefs.forEach(id => setSyncStatus(id, 'pending'));

        const duration = performance.now() - startTime;
        console.log(`✅ [BATCH CREATE] ${contentDataArray.length} items written to Firestore in ${duration.toFixed(2)}ms`);
      }
    } catch (err) {
      console.error('❌ Error creating content batch:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
    } finally {
      // Don't delay for batch operations - we want immediate feedback
      isCreatingContent.current = false;
    }
  }, [setSyncStatus, isCreatingContent, addStoreContent, canvasId, canEdit, userUid, enableFirestore]);

  return {
    createContent,
    updateContent,
    deleteContent,
    clearAllContent,
    startEditingContent,
    stopEditingContent,
    createContentBatch,
    updateContentBatch,
    deleteContentBatch
  };
};
