
import { useCallback, useRef } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { useCanvasStore } from '../../store/canvasStore';
import { SHAPE_RETRY_DELAY_MS, SHAPE_MAX_RETRIES, ENABLE_PERFORMANCE_LOGGING, CANVAS_ID } from '../../lib/config';
import type { Shape } from '../../types';

export const useShapeOperations = (shapes: Shape[], activelyEditingRef: React.MutableRefObject<Set<string>>, isCreatingShape: React.MutableRefObject<boolean>) => {
  const { updateShape: updateStoreShape, deleteShape: deleteStoreShape, setSyncStatus, clearAllShapes: clearAllShapesStore } = useCanvasStore();
  const retryCount = useRef(0);

  const throttledUpdate = useCallback(async (id: string, updates: Partial<Shape>) => {
    try {
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id);
      const updateData = { ...updates, updatedAt: serverTimestamp() };
      await updateDoc(shapeRef, updateData);
      setSyncStatus(id, 'synced');
      retryCount.current = 0;
    } catch (err) {
      console.error('Error updating shape:', err);
      setSyncStatus(id, 'error');
      if (retryCount.current < SHAPE_MAX_RETRIES) {
        retryCount.current++;
        const retryDelay = SHAPE_RETRY_DELAY_MS * retryCount.current;
        setTimeout(() => throttledUpdate(id, updates), retryDelay);
        if (ENABLE_PERFORMANCE_LOGGING) {
          console.log(`🔄 Shape update retry ${retryCount.current}/${SHAPE_MAX_RETRIES} in ${retryDelay}ms`);
        }
      }
    }
  }, [setSyncStatus]);

  const createShape = useCallback(async (shapeData: Omit<Shape, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    try {
      isCreatingShape.current = true;
      const shapesRef = collection(firestore, 'canvases', CANVAS_ID, 'shapes');
      const now = serverTimestamp();
      const newShape = { ...shapeData, createdAt: now, updatedAt: now };
      const docRef = await addDoc(shapesRef, newShape);
      setSyncStatus(docRef.id, 'pending');
    } catch (err) {
      console.error('Error creating shape:', err);
    } finally {
      setTimeout(() => {
        isCreatingShape.current = false;
      }, 100);
    }
  }, [setSyncStatus, isCreatingShape]);

  const updateShape = useCallback(async (id: string, updates: Partial<Shape>): Promise<void> => {
    try {
      activelyEditingRef.current.add(id);
      updateStoreShape(id, updates);
      setSyncStatus(id, 'pending');
      throttledUpdate(id, updates);
    } catch (err) {
      console.error('Error updating shape:', err);
      setSyncStatus(id, 'error');
    }
  }, [updateStoreShape, setSyncStatus, throttledUpdate, activelyEditingRef]);

  const deleteShape = useCallback(async (id: string): Promise<void> => {
    try {
      const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', id);
      deleteStoreShape(id);
      await deleteDoc(shapeRef);
    } catch (err) {
      console.error('Error deleting shape:', err);
    }
  }, [deleteStoreShape]);

  const clearAllShapes = useCallback(async (): Promise<void> => {
    try {
      const currentShapes = shapes;
      clearAllShapesStore();
      const deletePromises = currentShapes.map((shape) => {
        const shapeRef = doc(firestore, 'canvases', CANVAS_ID, 'shapes', shape.id);
        return deleteDoc(shapeRef);
      });
      await Promise.all(deletePromises);
    } catch (err) {
      console.error('Error clearing all shapes:', err);
    }
  }, [shapes, clearAllShapesStore]);

  const startEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.add(id);
    setTimeout(() => {
      if (activelyEditingRef.current.has(id)) {
        activelyEditingRef.current.delete(id);
      }
    }, 5000);
  }, [activelyEditingRef]);

  const stopEditingShape = useCallback((id: string): void => {
    activelyEditingRef.current.delete(id);
  }, [activelyEditingRef]);

  return { createShape, updateShape, deleteShape, clearAllShapes, startEditingShape, stopEditingShape };
};
