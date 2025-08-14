'use client';

import { useRef, useCallback } from 'react';

export interface SwipeNavigationOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number; // Minimum distance to trigger swipe (px)
  velocityThreshold?: number; // Minimum velocity to trigger swipe (px/ms)
  preventDefaultTouchBehavior?: boolean; // Prevent default touch behaviors like scrolling
}

export interface SwipeNavigationReturn {
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  isSwipeInProgress: boolean;
}

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  isPointerDown: boolean;
  pointerId: number | null;
  isHorizontalSwipe: boolean | null; // null = not determined, true = horizontal, false = vertical
}

export function useSwipeNavigation(options: SwipeNavigationOptions = {}): SwipeNavigationReturn {
  const {
    onSwipeLeft,
    onSwipeRight,
    threshold = 50,
    velocityThreshold = 0.1,
    preventDefaultTouchBehavior = true
  } = options;

  const swipeState = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    startTime: 0,
    isPointerDown: false,
    pointerId: null,
    isHorizontalSwipe: null
  });

  const resetSwipeState = useCallback(() => {
    swipeState.current = {
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      startTime: 0,
      isPointerDown: false,
      pointerId: null,
      isHorizontalSwipe: null
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only handle primary pointer (left mouse button or first touch)
    if (swipeState.current.isPointerDown && swipeState.current.pointerId !== null) {
      return;
    }

    swipeState.current.startX = e.clientX;
    swipeState.current.startY = e.clientY;
    swipeState.current.currentX = e.clientX;
    swipeState.current.currentY = e.clientY;
    swipeState.current.startTime = Date.now();
    swipeState.current.isPointerDown = true;
    swipeState.current.pointerId = e.pointerId;
    swipeState.current.isHorizontalSwipe = null;

    // Capture the pointer to continue receiving events even if pointer leaves element
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!swipeState.current.isPointerDown || swipeState.current.pointerId !== e.pointerId) {
      return;
    }

    swipeState.current.currentX = e.clientX;
    swipeState.current.currentY = e.clientY;

    const deltaX = Math.abs(e.clientX - swipeState.current.startX);
    const deltaY = Math.abs(e.clientY - swipeState.current.startY);

    // Determine if this is a horizontal or vertical swipe once we have enough movement
    if (swipeState.current.isHorizontalSwipe === null && (deltaX > 10 || deltaY > 10)) {
      swipeState.current.isHorizontalSwipe = deltaX > deltaY;
    }

    // Prevent default behavior for horizontal swipes to avoid conflicts with scrolling
    if (preventDefaultTouchBehavior && swipeState.current.isHorizontalSwipe && deltaX > 10) {
      e.preventDefault();
    }
  }, [preventDefaultTouchBehavior]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!swipeState.current.isPointerDown || swipeState.current.pointerId !== e.pointerId) {
      return;
    }

    const deltaX = swipeState.current.currentX - swipeState.current.startX;
    const distance = Math.abs(deltaX);
    const timeElapsed = Date.now() - swipeState.current.startTime;
    const velocity = distance / Math.max(timeElapsed, 1); // px/ms

    // Only trigger if this was determined to be a horizontal swipe
    if (swipeState.current.isHorizontalSwipe && distance >= threshold && velocity >= velocityThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    // Release pointer capture
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    
    resetSwipeState();
  }, [onSwipeLeft, onSwipeRight, threshold, velocityThreshold, resetSwipeState]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    if (swipeState.current.pointerId !== e.pointerId) {
      return;
    }

    // Release pointer capture if it was set
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore errors if pointer capture wasn't set
    }

    resetSwipeState();
  }, [resetSwipeState]);

  return {
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
    },
    isSwipeInProgress: swipeState.current.isPointerDown
  };
}