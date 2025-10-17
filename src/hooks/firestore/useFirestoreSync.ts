
import { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../lib/firebase';
import { CANVAS_ID } from '../../lib/config';
import type { Content } from '../../types';
import { ContentVersion } from '../../types';

export const useFirestoreSync = (userUid: string | undefined) => {
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentStateRef = useRef<Content[]>([]);
  const activelyEditingRef = useRef<Set<string>>(new Set());
  const isCreatingContent = useRef(false);
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    contentStateRef.current = content;
  }, [content]);

  useEffect(() => {
    if (!userUid) {
      setContent([]);
      setLoading(false);
      return;
    }

    const contentRef = collection(firestore, 'canvases', CANVAS_ID, 'content');
    const q = query(contentRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const contentData: Content[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const baseContent = {
            id: doc.id,
            version: data.version || ContentVersion.V1,
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
            contentData.push({ ...baseContent, type: 'rectangle', width: data.width, height: data.height, cornerRadius: data.cornerRadius });
          } else if (data.type === 'circle') {
            contentData.push({ ...baseContent, type: 'circle', radius: data.radius });
          } else if (data.type === 'text') {
            contentData.push({ 
              ...baseContent, 
              type: 'text', 
              text: data.text,
              fontSize: data.fontSize,
              fontFamily: data.fontFamily,
              fontStyle: data.fontStyle,
              width: data.width,
              height: data.height,
              textAlign: data.textAlign,
              verticalAlign: data.verticalAlign,
              isEditing: data.isEditing || false,
              editedBy: data.editedBy || null,
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

        const mergedContent = contentData.map((remoteContent) => {
          const local = contentStateRef.current.find((c) => c.id === remoteContent.id);
          const isActivelyEditing = activelyEditingRef.current.has(remoteContent.id);
          if (isActivelyEditing && local) {
            return local;
          }
          return remoteContent;
        });

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
  }, [userUid]);

  return { content, setContent, loading, error, activelyEditingRef, isCreatingContent };
};
