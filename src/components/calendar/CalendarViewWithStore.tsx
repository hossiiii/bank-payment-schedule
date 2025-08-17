'use client';

import React, { memo, useMemo, useCallback, useEffect } from 'react';
import { 
  useStoreActions
} from '@/store';
import { useOptimizedTransactions, useOptimizedMonthlySchedule } from '@/lib/hooks/optimizedUseDatabase';
import { useBanks, useCards } from '@/lib/hooks/useDatabase';
import { CalendarView } from './CalendarView';
import { Transaction, ScheduleItem } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

interface CalendarViewWithStoreProps {
  year: number;
  month: number;
  className?: string;
}

/**
 * Optimized Calendar View component that uses the new Zustand store
 * with memoization and performance optimizations
 */
const CalendarViewWithStore = memo<CalendarViewWithStoreProps>(({ 
  year, 
  month, 
  className 
}) => {
  const { modal } = useStoreActions();
  
  // Use optimized hooks for data fetching
  const startOfMonth = useMemo(() => new Date(year, month - 1, 1).getTime(), [year, month]);
  const endOfMonth = useMemo(() => new Date(year, month, 0, 23, 59, 59, 999).getTime(), [year, month]);
  
  const { 
    transactions, 
    // isLoading: isTransactionsLoading, 
    error: transactionsError 
  } = useOptimizedTransactions({
    dateRange: { start: startOfMonth, end: endOfMonth }
  });
  
  const { 
    schedule, 
    // isLoading: isScheduleLoading, 
    error: scheduleError 
  } = useOptimizedMonthlySchedule(year, month);

  const { banks } = useBanks();
  const { cards } = useCards();
  
  // Memoized calendar data preparation
  // @ts-ignore - Legacy code, will be removed in future refactor
  const _calendarData = useMemo(() => {
    if (!transactions && !schedule) return new Map<string, DayTotalData>();
    
    const dayTotals = new Map<string, DayTotalData>();
    
    // Process transactions
    transactions?.forEach(transaction => {
      const date = new Date(transaction.date);
      const dateKey = date.toISOString().split('T')[0]!; // YYYY-MM-DD format
      
      if (!dayTotals.has(dateKey)) {
        dayTotals.set(dateKey, {
          date: dateKey,
          totalAmount: 0,
          transactionCount: 0,
          scheduleCount: 0,
          transactionTotal: 0,
          cardTransactionTotal: 0,
          bankTransactionTotal: 0,
          scheduleTotal: 0,
          bankGroups: [],
          transactions: [],
          scheduleItems: [],
          hasData: false,
          hasTransactions: false,
          hasCardTransactions: false,
          hasBankTransactions: false,
          hasSchedule: false,
        });
      }
      
      const dayData = dayTotals.get(dateKey)!;
      dayData.transactions.push(transaction);
      dayData.transactionCount++;
      dayData.transactionTotal += transaction.amount;
      dayData.totalAmount += transaction.amount;
      dayData.hasData = true;
      dayData.hasTransactions = true;
      
      if (transaction.paymentType === 'card') {
        dayData.cardTransactionTotal += transaction.amount;
        dayData.hasCardTransactions = true;
      } else {
        dayData.bankTransactionTotal += transaction.amount;
        dayData.hasBankTransactions = true;
      }
    });
    
    // Process schedule items
    schedule?.items.forEach(scheduleItem => {
      const dateKey = scheduleItem.date.toISOString().split('T')[0];
      
      if (!dateKey) return; // Skip invalid dates
      
      if (!dayTotals.has(dateKey)) {
        dayTotals.set(dateKey, {
          date: dateKey,
          totalAmount: 0,
          transactionCount: 0,
          scheduleCount: 0,
          transactionTotal: 0,
          cardTransactionTotal: 0,
          bankTransactionTotal: 0,
          scheduleTotal: 0,
          bankGroups: [],
          transactions: [],
          scheduleItems: [],
          hasData: false,
          hasTransactions: false,
          hasCardTransactions: false,
          hasBankTransactions: false,
          hasSchedule: false,
        });
      }
      
      const dayData = dayTotals.get(dateKey)!;
      dayData.scheduleItems.push(scheduleItem);
      dayData.scheduleCount++;
      dayData.scheduleTotal += scheduleItem.amount;
      dayData.totalAmount += scheduleItem.amount;
      dayData.hasData = true;
      dayData.hasSchedule = true;
    });
    
    return dayTotals;
  }, [transactions, schedule]);
  
  // Memoized event handlers
  const handleTransactionClick = useCallback((transaction: Transaction) => {
    modal.openTransactionModal(new Date(transaction.date), transaction);
  }, [modal]);
  
  const handleTransactionViewClick = useCallback((date: Date, transactions: Transaction[]) => {
    modal.openTransactionViewModal(date, transactions);
  }, [modal]);
  
  const handleScheduleViewClick = useCallback((date: Date, scheduleItems: ScheduleItem[]) => {
    modal.openScheduleViewModal(date, scheduleItems);
  }, [modal]);
  
  // const handleDayTotalClick = useCallback((date: Date, dayTotalData: DayTotalData) => {
  //   modal.openDayTotalModal(date, dayTotalData);
  // }, [modal]);
  
  // const handleNewTransactionClick = useCallback((date: Date) => {
  //   modal.openTransactionModal(date);
  // }, [modal]);

  const handleDateClick = useCallback((date: Date) => {
    modal.openTransactionModal(date);
  }, [modal]);
  
  // Loading and error states
  // const isLoading = isTransactionsLoading || isScheduleLoading;
  const error = transactionsError || scheduleError;
  
  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error loading calendar data: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }
  
  return (
    <CalendarView
      year={year}
      month={month}
      transactions={transactions}
      {...(schedule && { schedule })}
      banks={banks}
      cards={cards}
      onDateClick={handleDateClick}
      onTransactionClick={handleTransactionClick}
      onTransactionViewClick={handleTransactionViewClick}
      onScheduleViewClick={handleScheduleViewClick}
      {...(className && { className })}
    />
  );
});

CalendarViewWithStore.displayName = 'CalendarViewWithStore';

// Higher-order component for additional performance optimizations
export const OptimizedCalendarView = memo<CalendarViewWithStoreProps>((props) => {
  // Pre-fetch adjacent months for better UX
  const { schedule: scheduleActions } = useStoreActions();
  
  useEffect(() => {
    const prefetchAdjacentMonths = async () => {
      try {
        // Pre-fetch previous month
        const prevMonth = props.month === 1 ? 12 : props.month - 1;
        const prevYear = props.month === 1 ? props.year - 1 : props.year;
        
        // Pre-fetch next month
        const nextMonth = props.month === 12 ? 1 : props.month + 1;
        const nextYear = props.month === 12 ? props.year + 1 : props.year;
        
        // Prefetch in background (don't await)
        scheduleActions.fetchMonthlySchedule(prevYear, prevMonth);
        scheduleActions.fetchMonthlySchedule(nextYear, nextMonth);
      } catch (error) {
        // Silently fail - prefetching is not critical
      }
    };
    
    // Debounce prefetching to avoid excessive requests
    const timeoutId = setTimeout(prefetchAdjacentMonths, 1000);
    return () => clearTimeout(timeoutId);
  }, [props.year, props.month, scheduleActions]);
  
  return <CalendarViewWithStore {...props} />;
});

OptimizedCalendarView.displayName = 'OptimizedCalendarView';

export default OptimizedCalendarView;