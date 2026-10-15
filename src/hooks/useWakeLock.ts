import { useState, useEffect, useCallback, useRef } from 'react';

export function useWakeLock(initialEnabled: boolean = true) {
  const [isSupported, setIsSupported] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled);
  const sentinelRef = useRef<any>(null);

  useEffect(() => {
    setIsSupported('wakeLock' in navigator);
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator) || !isEnabled) return;
    try {
      sentinelRef.current = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);

      sentinelRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (err) {
      console.warn('Wake Lock request error or denied:', err);
      setIsActive(false);
    }
  }, [isEnabled]);

  const releaseWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch (err) {
        console.warn('Wake lock release error:', err);
      }
      sentinelRef.current = null;
      setIsActive(false);
    }
  }, []);

  useEffect(() => {
    if (isEnabled) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isEnabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [isEnabled, requestWakeLock, releaseWakeLock]);

  const toggle = () => {
    setIsEnabled(prev => !prev);
  };

  return {
    isSupported,
    isActive,
    isEnabled,
    toggle,
    requestWakeLock,
    releaseWakeLock
  };
}
