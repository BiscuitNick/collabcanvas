
import { useCallback, useRef, useState, useEffect } from 'react';
import { collection, doc, updateDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { useCanvasId, useCanEdit } from '../../contexts/CanvasContext';
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES } from '../../lib/config';
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

// Minimize group contentData to reduce Firestore index entries
const minimizeGroupContentData = (contentData: any): any => {
  const minimized: any = {};
  for (const key in contentData) {
    const item = contentData[key];
    // Store only essential fields to reduce index entries
    minimized[key] = {
      type: item.type,
      x: item.x,
      y: item.y,
      // Type-specific essential fields
      ...(item.type === 'rectangle' && {
        width: item.width,
        height: item.height,
        fill: item.fill,
      }),
      ...(item.type === 'circle' && {
        radius: item.radius,
        fill: item.fill,
      }),
      ...(item.type === 'text' && {
        text: item.text,
        fontSize: item.fontSize,
        fill: item.fill,
      }),
      ...(item.type === 'image' && {
        src: item.src,
        width: item.width,
        height: item.height,
      }),
    };
  }
  return minimized;
};

export const useContentOperations = (
  content: Content[],
  _setContent: React.Dispatch<React.SetStateAction<Content[]>>, // Not used anymore - canvas store is source of truth
  activelyEditingRef: React.MutableRefObject<Set<string>>,
  isCreatingContent: React.MutableRefObject<boolean>,
  userUid: string | undefined,
  addToContentIds?: (id: string) => Promise<void>,
  removeFromContentIds?: (id: string) => Promise<void>
) => {
  const canvasId = useCanvasId();
  const canEdit = useCanEdit();
  const { addContent: addStoreContent, updateContent: updateStoreContent, deleteContent: deleteStoreContent, setSyncStatus, clearAllContent: clearAllContentStore } = useCanvasStore();
  const retryCount = useRef(0);

  // Track Firestore enabled state
  const [enableFirestore, setEnableFirestore] = useState(() => {
    const stored = localStorage.getItem('enableFirestore');
    const value = stored ? JSON.parse(stored) : true;
    return value;
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem('enableFirestore');
      const current = stored ? JSON.parse(stored) : true;
      if (current !== enableFirestore) {
        setEnableFirestore(current);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [enableFirestore]);

  const throttledUpdate = useCallback(async (id: string, updates: Partial<Content>) => {
    try {
      const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);

      // Minimize contentData for groups to avoid "too many index entries" error
      const updatesToStore = updates.type === 'group' && (updates as any).contentData ? {
        ...updates,
        contentData: minimizeGroupContentData((updates as any).contentData)
      } : updates;

      const updateData = removeUndefinedValues({
        ...updatesToStore,
        updatedAt: serverTimestamp(),
        lastEditedBy: userUid || null,
        lastEditedAt: serverTimestamp()
      });
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

      // Generate a unique ID with content type prefix for easier debugging
      // Format: {type}-{timestamp}-{random}
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const contentId = `${contentData.type}-${timestamp}-${randomSuffix}`;
      const contentRef = collection(firestore, 'canvases', canvasId, 'content');
      const newDocRef = doc(contentRef, contentId);

      const now = new Date();
      const localContent: Content = {
        ...contentData,
        id: contentId,
        createdAt: now,
        updatedAt: now,
        lastEditedBy: userUid || null,
        lastEditedAt: now,
      } as Content;

      // Add to local store first for optimistic updates
      addStoreContent(localContent);

      // Add to contentIds for z-index ordering
      if (addToContentIds) {
        await addToContentIds(contentId);
      }

      // Sync to Firestore if not in local-only mode
      if (!skipFirestore) {
        const firestoreTimestamp = serverTimestamp();
        console.log(`📤 [FIRESTORE] Syncing ${contentData.type} with ID: ${contentId}`);

        // Minimize contentData for groups to avoid "too many index entries" error
        const dataToStore = contentData.type === 'group' && 'contentData' in contentData ? {
          ...contentData,
          contentData: minimizeGroupContentData((contentData as any).contentData)
        } : contentData;

        const firestoreContent = removeUndefinedValues({
          ...dataToStore,
          createdAt: firestoreTimestamp,
          updatedAt: firestoreTimestamp,
          lastEditedBy: userUid || null,
          lastEditedAt: firestoreTimestamp
        });

        // Use setDoc instead of addDoc to use our pre-generated ID
        await setDoc(newDocRef, firestoreContent);
        setSyncStatus(contentId, 'synced');
      }
    } catch (err) {
      console.error('❌ Error creating content:', err);
    } finally {
      setTimeout(() => {
        isCreatingContent.current = false;
      }, 100);
    }
  }, [setSyncStatus, isCreatingContent, addStoreContent, canvasId, canEdit, addToContentIds, userUid]);

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
      // Remove from local store immediately (this removes from both content and contentIds in the store)
      deleteStoreContent(id);

      // Remove from Firestore contentIds array
      if (removeFromContentIds) {
        await removeFromContentIds(id);
      }

      // Mark as deleted in Firestore (soft delete) instead of removing the document
      // This ensures all connected users receive the delete update via the listener
      // Only sync to Firestore if it exists there (check syncStatus or if it has a type-based ID)
      if (enableFirestore && !id.startsWith('local-') && !id.startsWith('hardcoded-')) {
        const contentRef = doc(firestore, 'canvases', canvasId, 'content', id);
        await updateDoc(contentRef, {
          deleted: true,
          deletedBy: userUid || null,
          deletedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  }, [deleteStoreContent, removeFromContentIds, enableFirestore, canvasId, canEdit, userUid]);

  const clearAllContent = useCallback(async (): Promise<void> => {
    try {
      const currentContent = content;
      const allIds = currentContent.map(c => c.id);

      clearAllContentStore();

      // Clear contentIds array in Firestore
      if (enableFirestore) {
        const canvasRef = doc(firestore, 'canvases', canvasId);
        await updateDoc(canvasRef, {
          contentIds: [],
          contentIdsLastEditedBy: userUid || null,
          contentIdsLastEditedAt: serverTimestamp()
        });
      }

      // Mark all as deleted in Firestore (soft delete) instead of removing documents
      // This ensures all connected users receive the delete updates via the listener
      if (enableFirestore && allIds.length > 0) {
        const batch = writeBatch(firestore);
        const firestoreIds = allIds.filter(id => !id.startsWith('local-') && !id.startsWith('hardcoded-'));

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
          await batch.commit();
        }

        const localOnlyCount = allIds.length - firestoreIds.length;
        if (localOnlyCount > 0) {
        }
      } else {
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
      // Mark all as actively editing
      updatesList.forEach(({ id }) => {
        activelyEditingRef.current.add(id);
      });

      // Update local store immediately for all items
      updatesList.forEach(({ id, updates }) => {
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

          // Minimize contentData for groups to avoid "too many index entries" error
          const updatesToStore = updates.type === 'group' && (updates as any).contentData ? {
            ...updates,
            contentData: minimizeGroupContentData((updates as any).contentData)
          } : updates;

          const updateData = removeUndefinedValues({
            ...updatesToStore,
            updatedAt: serverTimestamp(),
            lastEditedBy: userUid || null,
            lastEditedAt: serverTimestamp()
          });
          batch.update(contentRef, updateData);
          setSyncStatus(id, 'pending');
        });

        await batch.commit();

        // Set all items to synced status
        updatesList.forEach(({ id }) => setSyncStatus(id, 'synced'));
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
      // Delete from local store immediately (this removes from both content and contentIds in the store)
      ids.forEach(id => {
        deleteStoreContent(id);
      });

      // Remove from Firestore contentIds array
      if (removeFromContentIds) {
        for (const id of ids) {
          await removeFromContentIds(id);
        }
      }

      // Mark as deleted in Firestore (soft delete) instead of removing documents
      // This ensures all connected users receive the delete updates via the listener
      if (enableFirestore) {
        const batch = writeBatch(firestore);
        const firestoreIds = ids.filter(id => !id.startsWith('local-') && !id.startsWith('hardcoded-'));

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
          await batch.commit();
        }
      }
    } catch (err) {
      console.error('❌ Error deleting content batch:', err);
    }
  }, [deleteStoreContent, removeFromContentIds, enableFirestore, canvasId, canEdit, userUid]);

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
      const contentRef = collection(firestore, 'canvases', canvasId, 'content');
      const baseTimestamp = Date.now();

      // Generate IDs upfront for all items with content type prefix
      const itemsWithIds = contentDataArray.map((contentData, index) => {
        // Add small increment to timestamp to ensure uniqueness in batch
        const timestamp = baseTimestamp + index;
        const randomSuffix = Math.random().toString(36).substr(2, 9);
        const contentId = `${contentData.type}-${timestamp}-${randomSuffix}`;
        const newDocRef = doc(contentRef, contentId);
        const now = new Date();

        return {
          id: contentId,
          docRef: newDocRef,
          content: {
            ...contentData,
            id: contentId,
            createdAt: now,
            updatedAt: now,
            lastEditedBy: userUid || null,
            lastEditedAt: now,
          } as Content
        };
      });

      // Add all items to store first (optimistic update)
      itemsWithIds.forEach(({ content }) => addStoreContent(content));

      // Add all IDs to contentIds for z-index ordering
      if (addToContentIds) {
        await Promise.all(itemsWithIds.map(({ id }) => addToContentIds(id)));
      }

      // Sync to Firestore if not in local-only mode
      if (!skipFirestore) {
        const batch = writeBatch(firestore);
        const now = serverTimestamp();

        itemsWithIds.forEach(({ docRef, content }) => {
          // Minimize contentData for groups to avoid "too many index entries" error
          const dataToStore = content.type === 'group' ? {
            ...content,
            contentData: minimizeGroupContentData((content as any).contentData)
          } : content;

          const firestoreContent = removeUndefinedValues({
            ...dataToStore,
            createdAt: now,
            updatedAt: now,
            lastEditedBy: userUid || null,
            lastEditedAt: now
          });

          // Remove the id field as it's in the document path
          delete (firestoreContent as any).id;

          batch.set(docRef, firestoreContent);
        });

        await batch.commit();

        // Set all items to synced status
        itemsWithIds.forEach(({ id }) => setSyncStatus(id, 'synced'));
      }
    } catch (err) {
      console.error('❌ Error creating content batch:', err);
      console.error('❌ Error details:', JSON.stringify(err, null, 2));
    } finally {
      // Don't delay for batch operations - we want immediate feedback
      isCreatingContent.current = false;
    }
  }, [setSyncStatus, isCreatingContent, addStoreContent, canvasId, canEdit, userUid, enableFirestore, addToContentIds]);

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
