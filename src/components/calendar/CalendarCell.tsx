'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { isSameDay, getJapaneseHolidayName, type CalendarDay } from '@/lib/utils/dateUtils';
import { formatAmount } from '@/lib/utils/validation';
import { DayTotalData } from '@/types/calendar';

interface CalendarCellProps {
  calendarDay: CalendarDay;
  selectedDate: Date | null;
  dayTotal: DayTotalData | undefined;
  onDateClick: (calendarDay: CalendarDay) => void;
  onTransactionClick: (calendarDay: CalendarDay, e: React.MouseEvent) => void;
  onScheduleClick: (calendarDay: CalendarDay, e: React.MouseEvent) => void;
}

export function CalendarCell({
  calendarDay,
  selectedDate,
  dayTotal,
  onDateClick,
  onTransactionClick,
  onScheduleClick
}: CalendarCellProps) {
  if (!calendarDay.date) {
    return <div className="p-2 min-h-[80px]" />;
  }

  const isSelected = selectedDate && isSameDay(calendarDay.date, selectedDate);
  const dayOfWeek = calendarDay.date.getDay();
  const holidayName = calendarDay.isHoliday ? getJapaneseHolidayName(calendarDay.date) : null;

  return (
    <div
      onClick={() => onDateClick(calendarDay)}
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
        {dayTotal && dayTotal.hasData && (
          <>
            {/* カード払い取引データがある場合のみ表示（銀行引落は表示しない） */}
            {dayTotal.hasCardTransactions && dayTotal.cardTransactionTotal > 0 && (
              <div 
                className="px-2 py-1 text-xs rounded cursor-pointer bg-green-100 text-green-900 hover:bg-green-200 border border-green-300 font-semibold"
                onClick={(e) => onTransactionClick(calendarDay, e)}
                title={`カード取引合計: ${formatAmount(dayTotal.cardTransactionTotal)} (カード取引のみ)`}
              >
                <div className="text-center">
                  <div className="text-xs font-bold">取引合計</div>
                  <div className="text-sm font-bold">{formatAmount(dayTotal.cardTransactionTotal)}</div>
                </div>
              </div>
            )}
            
            {/* 引落予定データがある場合 */}
            {dayTotal.hasSchedule && dayTotal.scheduleTotal > 0 && (
              <div 
                className="px-2 py-1 text-xs rounded cursor-pointer bg-blue-100 text-blue-900 hover:bg-blue-200 border border-blue-300 font-semibold"
                onClick={(e) => onScheduleClick(calendarDay, e)}
                title={`引落予定合計: ${formatAmount(dayTotal.scheduleTotal)} (予定${dayTotal.scheduleCount}件)`}
              >
                <div className="text-center">
                  <div className="text-xs font-bold">引落予定</div>
                  <div className="text-sm font-bold">{formatAmount(dayTotal.scheduleTotal)}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}