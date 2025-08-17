'use client';

import { useCallback } from 'react';
import { getCurrentJapanDate } from '@/lib/utils/dateUtils';

export interface UseCalendarNavigationProps {
  year: number;
  month: number;
  onMonthChange?: ((year: number, month: number) => void) | undefined;
}

export interface UseCalendarNavigationReturn {
  handlePreviousMonth: () => void;
  handleNextMonth: () => void;
  handleTodayNavigation: () => void;
  canNavigate: boolean;
}

/**
 * カレンダーのナビゲーション機能を管理するフック
 * 月の移動と今日への移動を処理する
 */
export function useCalendarNavigation({
  year,
  month,
  onMonthChange
}: UseCalendarNavigationProps): UseCalendarNavigationReturn {

  // 前の月に移動
  const handlePreviousMonth = useCallback(() => {
    if (!onMonthChange) return;
    
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  }, [year, month, onMonthChange]);

  // 次の月に移動
  const handleNextMonth = useCallback(() => {
    if (!onMonthChange) return;
    
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  }, [year, month, onMonthChange]);

  // 今日の月に移動
  const handleTodayNavigation = useCallback(() => {
    if (!onMonthChange) return;
    
    const today = getCurrentJapanDate();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;
    
    // 既に今月を表示している場合は何もしない
    if (year === currentYear && month === currentMonth) {
      return;
    }
    
    onMonthChange(currentYear, currentMonth);
  }, [year, month, onMonthChange]);

  // ナビゲーション可能かどうか
  const canNavigate = Boolean(onMonthChange);

  return {
    handlePreviousMonth,
    handleNextMonth,
    handleTodayNavigation,
    canNavigate
  };
}