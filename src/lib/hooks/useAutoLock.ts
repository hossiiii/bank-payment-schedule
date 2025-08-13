'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useEncryption } from './useEncryption';

interface UseAutoLockOptions {
  enabled?: boolean;
  timeoutMinutes?: number;
  warnBeforeMinutes?: number;
  onWarn?: () => void;
  onLock?: () => void;
}

/**
 * Custom hook for automatic session locking after inactivity
 */
export function useAutoLock({
  enabled = true,
  timeoutMinutes = 15,
  warnBeforeMinutes = 2,
  onWarn,
  onLock
}: UseAutoLockOptions = {}) {
  const { isUnlocked, lock } = useEncryption();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warnTimeoutRef = useRef<NodeJS.Timeout>();
  const lastActivityRef = useRef<number>(Date.now());
  
  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warnTimeoutRef.current) {
      clearTimeout(warnTimeoutRef.current);
    }
    
    if (!enabled || !isUnlocked) return;
    
    // Set warning timeout
    if (warnBeforeMinutes > 0 && onWarn) {
      const warnMs = (timeoutMinutes - warnBeforeMinutes) * 60 * 1000;
      warnTimeoutRef.current = setTimeout(() => {
        onWarn();
      }, warnMs);
    }
    
    // Set lock timeout
    const lockMs = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(async () => {
      try {
        await lock();
        onLock?.();
      } catch (error) {
        console.error('Failed to auto-lock session:', error);
      }
    }, lockMs);
  }, [enabled, isUnlocked, timeoutMinutes, warnBeforeMinutes, lock, onWarn, onLock]);
  
  // Setup event listeners for user activity
  useEffect(() => {
    if (!enabled || !isUnlocked) {
      // Clear timeouts if disabled or locked
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warnTimeoutRef.current) {
        clearTimeout(warnTimeoutRef.current);
      }
      return;
    }
    
    // Activity events to track
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];
    
    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });
    
    // Start initial timeout
    handleActivity();
    
    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warnTimeoutRef.current) {
        clearTimeout(warnTimeoutRef.current);
      }
    };
  }, [enabled, isUnlocked, handleActivity]);
  
  // Check for idle time
  const getIdleTime = useCallback(() => {
    return Date.now() - lastActivityRef.current;
  }, []);
  
  // Reset timer manually
  const resetTimer = useCallback(() => {
    handleActivity();
  }, [handleActivity]);
  
  // Cancel auto-lock
  const cancelAutoLock = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warnTimeoutRef.current) {
      clearTimeout(warnTimeoutRef.current);
    }
  }, []);
  
  return {
    getIdleTime,
    resetTimer,
    cancelAutoLock
  };
}

