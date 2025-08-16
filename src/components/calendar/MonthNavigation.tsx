'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getCurrentJapanDate, getMonthNameJP } from '@/lib/utils/dateUtils';

export interface MonthNavigationProps {
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  className?: string;
}

export function MonthNavigation({ 
  year, 
  month, 
  onMonthChange, 
  className 
}: MonthNavigationProps) {
  const handlePrevious = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNext = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const handleToday = () => {
    const today = getCurrentJapanDate();
    onMonthChange(today.getFullYear(), today.getMonth() + 1);
  };

  return (
    <div className={cn(
      'flex items-center justify-between p-4 bg-white border-b border-gray-200',
      className
    )}>
      <button
        onClick={handlePrevious}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="前の月"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {year}年 {getMonthNameJP(month)}
        </h2>
        <button
          onClick={handleToday}
          className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
        >
          今日
        </button>
      </div>

      <button
        onClick={handleNext}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label="次の月"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}