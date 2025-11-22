import { useEffect, useRef, useState } from 'react';

/**
 * useWakeLock Hook
 * 防止裝置螢幕在運動過程中自動休眠
 */
export const useWakeLock = () => {
  const wakeLock = useRef<WakeLockSentinel | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLock.current = await navigator.wakeLock.request('screen');
        wakeLock.current.addEventListener('release', () => {
          setIsLocked(false);
          console.log('Wake Lock released');
        });
        setIsLocked(true);
        console.log('Wake Lock active');
      }
    } catch (err: any) {
      console.error(`${err.name}, ${err.message}`);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLock.current) {
      try {
        await wakeLock.current.release();
        wakeLock.current = null;
      } catch (err: any) {
        console.error(`${err.name}, ${err.message}`);
      }
    }
  };

  useEffect(() => {
    // 組件掛載時請求鎖定
    requestWakeLock();

    // 處理頁面可見性變化 (例如使用者切換分頁後回來，需重新鎖定)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      releaseWakeLock();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return { isLocked };
};
