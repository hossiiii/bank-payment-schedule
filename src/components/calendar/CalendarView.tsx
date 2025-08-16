'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { 
  createCalendarGrid,
  getCurrentJapanDate,
  getMonthNameJP,
  formatDateISO,
  isSameDay,
  getJapaneseHolidayName,
  type CalendarDay 
} from '@/lib/utils/dateUtils';
import { formatAmount } from '@/lib/utils/validation';
import { Transaction, MonthlySchedule, Bank, Card } from '@/types/database';
import { DayTotalData } from '@/types/calendar';
import { useSwipeNavigation } from '@/lib/hooks/useSwipeNavigation';

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
  onScheduleViewClick?: (date: Date, scheduleItems: any[]) => void;
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
  
  // Handle month navigation for swipe/drag
  const handlePreviousMonth = () => {
    if (onMonthChange) {
      if (month === 1) {
        onMonthChange(year - 1, 12);
      } else {
        onMonthChange(year, month - 1);
      }
    }
  };

  const handleNextMonth = () => {
    if (onMonthChange) {
      if (month === 12) {
        onMonthChange(year + 1, 1);
      } else {
        onMonthChange(year, month + 1);
      }
    }
  };

  // Swipe navigation hook
  const { handlers } = useSwipeNavigation({
    onSwipeLeft: handleNextMonth,
    onSwipeRight: handlePreviousMonth,
    threshold: 60,
    velocityThreshold: 0.1,
    preventDefaultTouchBehavior: true,
    enableClickInterception: false // Disable pointer capture to allow click events
  });
  
  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return createCalendarGrid(year, month);
  }, [year, month]);

  // Removed transactionsByDate and scheduleByDate as we now use calculateDayTotals

  // Calculate day totals for new display
  const calculateDayTotals = useMemo(() => {
    const totals = new Map<string, DayTotalData>();
    
    // Process transactions
    transactions.forEach(transaction => {
      const dateKey = formatDateISO(new Date(transaction.date));
      
      if (!totals.has(dateKey)) {
        totals.set(dateKey, {
          date: dateKey,
          totalAmount: 0,
          transactionCount: 0,
          scheduleCount: 0,
          transactionTotal: 0,
          scheduleTotal: 0,
          bankGroups: [],
          transactions: [],
          scheduleItems: [],
          hasData: false,
          hasTransactions: false,
          hasSchedule: false
        });
      }
      
      const dayTotal = totals.get(dateKey)!;
      dayTotal.transactionTotal += transaction.amount;
      dayTotal.totalAmount += transaction.amount;
      dayTotal.transactionCount++;
      dayTotal.transactions.push(transaction);
      dayTotal.hasData = true;
      dayTotal.hasTransactions = true;
    });
    
    // Process schedule items
    if (schedule) {
      schedule.items.forEach(item => {
        const dateKey = formatDateISO(item.date);
        
        if (!totals.has(dateKey)) {
          totals.set(dateKey, {
            date: dateKey,
            totalAmount: 0,
            transactionCount: 0,
            scheduleCount: 0,
            transactionTotal: 0,
            scheduleTotal: 0,
            bankGroups: [],
            transactions: [],
            scheduleItems: [],
            hasData: false,
            hasTransactions: false,
            hasSchedule: false
          });
        }
        
        const dayTotal = totals.get(dateKey)!;
        dayTotal.scheduleTotal += item.amount;
        dayTotal.totalAmount += item.amount;
        dayTotal.scheduleCount++;
        dayTotal.scheduleItems.push(item);
        dayTotal.hasData = true;
        dayTotal.hasSchedule = true;
      });
    }
    
    return totals;
  }, [transactions, schedule]);

  const handleDateClick = (calendarDay: CalendarDay) => {
    if (!calendarDay.date) return;
    
    setSelectedDate(calendarDay.date);
    onDateClick(calendarDay.date);
  };

  const handleTransactionClick = (calendarDay: CalendarDay, e: React.MouseEvent) => {
    e.stopPropagation(); // 日付クリックとは別のイベントとして処理
    
    if (!calendarDay.date || !onTransactionViewClick) return;
    
    const dateKey = formatDateISO(calendarDay.date);
    const dayTotal = calculateDayTotals.get(dateKey);
    
    if (dayTotal && dayTotal.hasTransactions) {
      onTransactionViewClick(calendarDay.date, dayTotal.transactions);
    }
  };

  const handleScheduleClick = (calendarDay: CalendarDay, e: React.MouseEvent) => {
    e.stopPropagation(); // 日付クリックとは別のイベントとして処理
    
    if (!calendarDay.date || !onScheduleViewClick) return;
    
    const dateKey = formatDateISO(calendarDay.date);
    const dayTotal = calculateDayTotals.get(dateKey);
    
    if (dayTotal && dayTotal.hasSchedule) {
      onScheduleViewClick(calendarDay.date, dayTotal.scheduleItems);
    }
  };

  // Transaction click handler removed as we now only handle date clicks for totals

  const weekdayHeaders = ['日', '月', '火', '水', '木', '金', '土'];

  return (
    <div 
      className={cn('bg-white rounded-lg shadow-sm', className)}
      {...handlers}
      style={{ touchAction: 'pan-y' }} // Allow vertical scrolling but intercept horizontal
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
        {calendarGrid.map((calendarDay, index) => {
          if (!calendarDay.date) {
            return <div key={index} className="p-2 min-h-[80px]" />;
          }

          const dateKey = formatDateISO(calendarDay.date);
          // dayTransactions and daySchedule variables removed as we now use calculateDayTotals
          const isSelected = selectedDate && isSameDay(calendarDay.date, selectedDate);
          const dayOfWeek = calendarDay.date.getDay();
          const holidayName = calendarDay.isHoliday ? getJapaneseHolidayName(calendarDay.date) : null;

          return (
            <div
              key={index}
              onClick={() => handleDateClick(calendarDay)}
              className={cn(
                'p-2 min-h-[80px] border-b border-r border-gray-100 cursor-pointer',
                'hover:bg-gray-50 transition-colors duration-150',
                'flex flex-col',
                isSelected && 'bg-blue-50 ring-2 ring-blue-500 ring-inset',
                !calendarDay.isCurrentMonth && 'bg-gray-50',
                calendarDay.isToday && 'bg-blue-100 font-semibold'
              )}
            >
              {/* Date number with holiday name */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex flex-col">
                  <span className={cn(
                    'text-sm leading-tight',
                    !calendarDay.isCurrentMonth && 'text-gray-400',
                    calendarDay.isToday && 'text-blue-700 font-bold',
                    calendarDay.isWeekend && calendarDay.isCurrentMonth && !calendarDay.isToday && (
                      dayOfWeek === 0 ? 'text-red-600' : 'text-blue-600'
                    ),
                    calendarDay.isHoliday && calendarDay.isCurrentMonth && 'text-red-600'
                  )}>
                    {calendarDay.date.getDate()}{holidayName && `（${holidayName}）`}
                  </span>
                </div>
                
                {/* Holiday indicator */}
                {calendarDay.isHoliday && calendarDay.isCurrentMonth && (
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </div>

              {/* Payment Total Display */}
              <div className="flex-1 space-y-1">
                {(() => {
                  const dayTotal = calculateDayTotals.get(dateKey);
                  if (!dayTotal || !dayTotal.hasData) return null;
                  
                  const items = [];
                  
                  // 取引データがある場合
                  if (dayTotal.hasTransactions && dayTotal.transactionTotal > 0) {
                    items.push(
                      <div 
                        key="transaction"
                        className="px-2 py-1 text-xs rounded cursor-pointer bg-green-100 text-green-900 hover:bg-green-200 border border-green-300 font-semibold"
                        onClick={(e) => handleTransactionClick(calendarDay, e)}
                        title={`取引合計: ${formatAmount(dayTotal.transactionTotal)} (取引${dayTotal.transactionCount}件)`}
                      >
                        <div className="text-center">
                          <div className="text-xs font-bold">取引合計</div>
                          <div className="text-sm font-bold">{formatAmount(dayTotal.transactionTotal)}</div>
                        </div>
                      </div>
                    );
                  }
                  
                  // 引落予定データがある場合
                  if (dayTotal.hasSchedule && dayTotal.scheduleTotal > 0) {
                    items.push(
                      <div 
                        key="schedule"
                        className="px-2 py-1 text-xs rounded cursor-pointer bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300 font-semibold"
                        onClick={(e) => handleScheduleClick(calendarDay, e)}
                        title={`引落予定合計: ${formatAmount(dayTotal.scheduleTotal)} (予定${dayTotal.scheduleCount}件)`}
                      >
                        <div className="text-center">
                          <div className="text-xs font-bold">引落予定</div>
                          <div className="text-sm font-bold">{formatAmount(dayTotal.scheduleTotal)}</div>
                        </div>
                      </div>
                    );
                  }
                  
                  return items;
                })()}
              </div>
            </div>
          );
        })}
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

// Month navigation component
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