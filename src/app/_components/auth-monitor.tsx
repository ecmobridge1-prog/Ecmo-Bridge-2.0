'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

export default function AuthMonitor() {
  const { user, isLoaded } = useUser();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    // If user was logged in before but now is not (logout detected)
    if (previousUserIdRef.current && !user) {
      // Clear all NPI verification data from session storage
      // We clear all keys that start with 'npi_verified' to handle any user
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('npi_verified')) {
          keysToRemove.push(key);
        }
      }
      
      // Remove all NPI verification keys
      keysToRemove.forEach(key => {
        sessionStorage.removeItem(key);
      });
      
      console.log('User logged out - cleared NPI verification data');
    }

    // Update the previous user ID
    previousUserIdRef.current = user?.id || null;
  }, [user, isLoaded]);

  // This component doesn't render anything
  return null;
}
