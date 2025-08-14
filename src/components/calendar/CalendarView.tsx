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
  onMonthChange?: (year: number, month: number) => void;
  className?: string;
}

export function CalendarView({
  year,
  month,
  transactions,
  schedule,
  banks,
  cards,
  onDateClick,
  onTransactionClick,
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
    preventDefaultTouchBehavior: true
  });
  
  // Generate calendar grid
  const calendarGrid = useMemo(() => {
    return createCalendarGrid(year, month);
  }, [year, month]);

  // Group transactions by date
  const transactionsByDate = useMemo(() => {
    const grouped = new Map<string, Transaction[]>();
    
    transactions.forEach(transaction => {
      const dateKey = formatDateISO(new Date(transaction.date));
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(transaction);
    });
    
    return grouped;
  }, [transactions]);

  // Group schedule by date
  const scheduleByDate = useMemo(() => {
    if (!schedule) return new Map<string, any[]>();
    
    const grouped = new Map<string, any[]>();
    
    // Add payment dates from schedule
    schedule.items.forEach(item => {
      const dateKey = formatDateISO(item.date);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push({
        type: 'payment',
        bankName: item.bankName,
        cardName: item.cardName,
        paymentType: item.paymentType,
        amount: item.amount,
        storeName: item.storeName
      });
    });
    
    return grouped;
  }, [schedule]);

  const handleDateClick = (calendarDay: CalendarDay) => {
    if (!calendarDay.date) return;
    
    setSelectedDate(calendarDay.date);
    onDateClick(calendarDay.date);
  };

  const handleTransactionClick = (e: React.MouseEvent, transaction: Transaction) => {
    e.stopPropagation();
    onTransactionClick(transaction);
  };

  // Helper function to get payment method name
  const getPaymentMethodName = (transaction: Transaction): string => {
    if (transaction.paymentType === 'card' && transaction.cardId) {
      const card = cards.find(c => c.id === transaction.cardId);
      return card?.name || 'カード';
    } else if (transaction.paymentType === 'bank' && transaction.bankId) {
      const bank = banks.find(b => b.id === transaction.bankId);
      return bank?.name || '銀行';
    }
    return transaction.paymentType === 'card' ? 'カード' : '銀行';
  };

  // Helper function to format transaction display name
  const getTransactionDisplayName = (transaction: Transaction): string => {
    const storeName = transaction.storeName || '取引';
    const paymentMethod = getPaymentMethodName(transaction);
    return `${storeName}（${paymentMethod}）`;
  };

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
          const dayTransactions = transactionsByDate.get(dateKey) || [];
          const daySchedule = scheduleByDate.get(dateKey) || [];
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

              {/* Transactions */}
              <div className="flex-1 space-y-1">
                {dayTransactions.slice(0, 2).map((transaction) => (
                  <div
                    key={transaction.id}
                    onClick={(e) => handleTransactionClick(e, transaction)}
                    className={cn(
                      'px-1 py-0.5 text-xs rounded truncate',
                      'bg-green-100 text-green-800 hover:bg-green-200',
                      'border border-green-200'
                    )}
                    title={`${getTransactionDisplayName(transaction)}: ${formatAmount(transaction.amount)}`}
                  >
                    <div className="truncate">
                      {getTransactionDisplayName(transaction)}
                    </div>
                    <div className="text-xs font-medium">
                      {formatAmount(transaction.amount)}
                    </div>
                  </div>
                ))}

                {/* Payment schedule items */}
                {daySchedule.slice(0, 2 - dayTransactions.slice(0, 2).length).map((item, scheduleIndex) => (
                  <div
                    key={scheduleIndex}
                    className={cn(
                      'px-1 py-0.5 text-xs rounded truncate',
                      'bg-orange-100 text-orange-800',
                      'border border-orange-200'
                    )}
                    title={`${item.paymentType === 'bank' ? '銀行引落' : item.cardName} - ${item.storeName || '支払い'}: ${formatAmount(item.amount)}`}
                  >
                    <div className="truncate">
                      {item.paymentType === 'bank' ? '銀行引落' : item.cardName}
                    </div>
                    <div className="text-xs font-medium">
                      {formatAmount(item.amount)}
                    </div>
                  </div>
                ))}

                {/* Show more indicator */}
                {(dayTransactions.length + daySchedule.length) > 2 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{(dayTransactions.length + daySchedule.length) - 2} 件
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
            <span className="text-gray-600">取引</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded" />
            <span className="text-gray-600">支払い予定</span>
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