'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  createCalendarGrid,
  getMonthNameJP,
  type CalendarDay 
} from '@/lib/utils/dateUtils';
import { Transaction, MonthlySchedule, Bank, Card, ScheduleItem } from '@/types/database';
import { useCalendarCalculations } from '@/hooks/calendar/useCalendarCalculations';
import { useCalendarNavigation } from '@/hooks/calendar/useCalendarNavigation';
import { useSwipeGesture } from '@/hooks/calendar/useSwipeGesture';
import { CalendarCell } from './CalendarCell';

export interface CalendarViewProps {
  year: number;
  month: number;
  transactions: Transaction[];
  schedule?: MonthlySchedule;
  banks: Bank[];
  cards: Card[];
  onDateClick: (date: Date) => void;
  onTransactionClick: (transaction: Transaction) => void;
  onTransactionViewClick?: (date: Date, transactions: Transaction[]) => void;
  onScheduleViewClick?: (date: Date, scheduleItems: ScheduleItem[]) => void;
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

export function CalendarView({
  year,
  month,
  transactions,
  schedule,
  banks: _banks,
  cards: _cards,
  onDateClick,
  onTransactionClick: _onTransactionClick,
  onTransactionViewClick,
  onScheduleViewClick,
  onMonthChange,
  className
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // 日付計算フック
  const { getDayTotal } = useCalendarCalculations({
    transactions,
    schedule
  });

  // ナビゲーションフック
  const { handlePreviousMonth, handleNextMonth } = useCalendarNavigation({
    year,
    month,
    onMonthChange
  });

  // スワイプジェスチャーフック
  const { swipeHandlers, touchActionStyle } = useSwipeGesture({
    onSwipeLeft: handleNextMonth,
    onSwipeRight: handlePreviousMonth,
    threshold: 60,
    velocityThreshold: 0.1,
    preventDefaultTouchBehavior: true,
    enableClickInterception: false
  });
  
  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return createCalendarGrid(year, month);
  }, [year, month]);

  const handleDateClick = (calendarDay: CalendarDay) => {
    if (!calendarDay.date) return;
    
    setSelectedDate(calendarDay.date);
    onDateClick(calendarDay.date);
  };

  const handleTransactionClick = (calendarDay: CalendarDay, e: React.MouseEvent) => {
    e.stopPropagation(); // 日付クリックとは別のイベントとして処理
    
    if (!calendarDay.date || !onTransactionViewClick) return;
    
    const dayTotal = getDayTotal(calendarDay.date);
    
    if (dayTotal && dayTotal.hasTransactions) {
      onTransactionViewClick(calendarDay.date, dayTotal.transactions);
    }
  };

  const handleScheduleClick = (calendarDay: CalendarDay, e: React.MouseEvent) => {
    e.stopPropagation(); // 日付クリックとは別のイベントとして処理
    
    if (!calendarDay.date || !onScheduleViewClick) return;
    
    const dayTotal = getDayTotal(calendarDay.date);
    
    if (dayTotal && dayTotal.hasSchedule) {
      onScheduleViewClick(calendarDay.date, dayTotal.scheduleItems);
    }
  };

  // Transaction click handler removed as we now only handle date clicks for totals

  const weekdayHeaders = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div 
      className={cn('bg-white rounded-lg shadow-sm', className)}
      {...swipeHandlers}
      style={touchActionStyle}
    >
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          {year}年 {getMonthNameJP(month)}
        </h2>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekdayHeaders.map((weekday, index) => (
          <div
            key={index}
            className={cn(
              'p-2 text-center text-sm font-medium',
              index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-600'
            )}
          >
            {weekday}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {calendarGrid.map((calendarDay, index) => (
          <CalendarCell
            key={index}
            calendarDay={calendarDay}
            selectedDate={selectedDate}
            dayTotal={calendarDay.date ? getDayTotal(calendarDay.date) : undefined}
            onDateClick={handleDateClick}
            onTransactionClick={handleTransactionClick}
            onScheduleClick={handleScheduleClick}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
            <span className="text-gray-600">取引合計</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
            <span className="text-gray-600">引落予定</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-gray-600">祝日</span>
          </div>
        </div>
      </div>
    </div>
  );
}
