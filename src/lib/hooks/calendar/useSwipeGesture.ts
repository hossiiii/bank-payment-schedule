'use client';

import { useSwipeNavigation } from '@/lib/hooks/useSwipeNavigation';

export interface UseSwipeGestureProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  velocityThreshold?: number;
  preventDefaultTouchBehavior?: boolean;
  enableClickInterception?: boolean;
}

export interface UseSwipeGestureReturn {
  swipeHandlers: {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
  };
  isSwipeInProgress: boolean;
  touchActionStyle: React.CSSProperties;
}

/**
 * カレンダー用のスワイプジェスチャー機能を管理するフック
 * 既存のuseSwipeNavigationをラップして、カレンダー特化の設定を適用
 */
export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 60,
  velocityThreshold = 0.1,
  preventDefaultTouchBehavior = true,
  enableClickInterception = false
}: UseSwipeGestureProps = {}): UseSwipeGestureReturn {

  // 既存のスワイプナビゲーションフックを使用
  const { handlers, isSwipeInProgress } = useSwipeNavigation({
    ...(onSwipeLeft && { onSwipeLeft }),
    ...(onSwipeRight && { onSwipeRight }),
    threshold,
    velocityThreshold,
    preventDefaultTouchBehavior,
    enableClickInterception
  });

  // カレンダー用のタッチアクション設定
  const touchActionStyle: React.CSSProperties = {
    touchAction: 'pan-y' // 垂直スクロールは許可し、水平スワイプを検出
  };

  return {
    swipeHandlers: handlers,
    isSwipeInProgress,
    touchActionStyle
  };
}