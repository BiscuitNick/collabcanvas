
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { CANVAS_ID } from '../../lib/config';
import type { Shape } from '../../types';
import { ShapeVersion } from '../../types';

export const useFirestoreSync = (userUid: string | undefined) => {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shapesStateRef = useRef<Shape[]>([]);
  const activelyEditingRef = useRef<Set<string>>(new Set());
  const isCreatingShape = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    shapesStateRef.current = shapes;
  }, [shapes]);

  useEffect(() => {
    if (!userUid) {
      setShapes([]);
      setLoading(false);
      return;
    }

    const shapesRef = collection(firestore, 'canvases', CANVAS_ID, 'shapes');
    const q = query(shapesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const shapesData: Shape[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const baseShape = {
            id: doc.id,
            version: data.version || ShapeVersion.V1,
            x: data.x,
            y: data.y,
            rotation: data.rotation || 0,
            fill: data.fill,
            stroke: data.stroke,
            strokeWidth: data.strokeWidth,
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
            shapesData.push({ ...baseShape, type: 'rectangle', width: data.width, height: data.height });
          } else if (data.type === 'circle') {
            shapesData.push({ ...baseShape, type: 'circle', radius: data.radius });
          }
        });

        const mergedShapes = shapesData.map((remoteShape) => {
          const local = shapesStateRef.current.find((s) => s.id === remoteShape.id);
          const isActivelyEditing = activelyEditingRef.current.has(remoteShape.id);
          if (isActivelyEditing && local) {
            return local;
          }
          return remoteShape;
        });

        if (updateTimeoutRef.current) {
          clearTimeout(updateTimeoutRef.current);
        }

        updateTimeoutRef.current = setTimeout(() => {
          setShapes(mergedShapes);
          setLoading(false);
          setError(null);
        }, isCreatingShape.current ? 100 : 0);
      },
      (err) => {
        console.error('Error listening to shapes:', err);
        setError('Failed to sync shapes');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [userUid]);

  return { shapes, setShapes, loading, error, activelyEditingRef, isCreatingShape };
};
