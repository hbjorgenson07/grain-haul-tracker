'use client';

import { useState, useCallback } from 'react';

export type GpsStatus = 'prompt' | 'granted' | 'denied' | 'unavailable';

export interface GpsCoords {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function useGps() {
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>(
    typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'prompt' : 'unavailable'
  );

  const getCurrentPosition = useCallback((): Promise<GpsCoords | null> => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setGpsStatus('unavailable');
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsStatus('granted');
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsStatus('denied');
          }
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  const requestPermission = useCallback(async () => {
    await getCurrentPosition();
  }, [getCurrentPosition]);

  return { gpsStatus, requestPermission, getCurrentPosition };
}
