
import { useCallback, useEffect } from 'react';

export const useContentLocking = () => {
  // DEPRECATED: Locking is now handled by RTDB presence system
  // This hook is kept for backward compatibility but does nothing

  const lockContent = useCallback(async (_id: string): Promise<void> => {
    // No-op: Locking handled by RTDB
    return;
  }, []);

  const unlockContent = useCallback(async (_id: string): Promise<void> => {
    // No-op: Locking handled by RTDB
    return;
  }, []);

  useEffect(() => {
    // No cleanup needed
    return () => {};
  }, []);

  return { lockContent, unlockContent };
};
