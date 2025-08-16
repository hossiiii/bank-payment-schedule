'use client';

import { useMemo } from 'react';
import { formatDateISO } from '@/lib/utils/dateUtils';
import { Transaction, MonthlySchedule } from '@/types/database';
import { DayTotalData } from '@/types/calendar';

export interface UseCalendarCalculationsProps {
  transactions: Transaction[];
  schedule?: MonthlySchedule | undefined;
}

export interface UseCalendarCalculationsReturn {
  dayTotals: Map<string, DayTotalData>;
  getDayTotal: (date: Date) => DayTotalData | undefined;
  hasDayData: (date: Date) => boolean;
  getMonthTotal: () => number;
}

/**
 * カレンダーの日付計算ロジックを管理するフック
 * 取引データと引落予定データを統合して日別の合計を計算する
 */
export function useCalendarCalculations({
  transactions,
  schedule
}: UseCalendarCalculationsProps): UseCalendarCalculationsReturn {
  
  // 日別の合計データを計算
  const dayTotals = useMemo(() => {
    const totals = new Map<string, DayTotalData>();
    
    // Process transactions
    transactions.forEach(transaction => {
      const dateKey = formatDateISO(new Date(transaction.date));
      
      if (!totals.has(dateKey)) {
        totals.set(dateKey, createEmptyDayTotal(dateKey));
      }
      
      const dayTotal = totals.get(dateKey)!;
      dayTotal.transactionTotal += transaction.amount;
      dayTotal.totalAmount += transaction.amount;
      dayTotal.transactionCount++;
      dayTotal.transactions.push(transaction);
      dayTotal.hasData = true;
      dayTotal.hasTransactions = true;
      
      // 支払い方法別の集計
      if (transaction.paymentType === 'card') {
        dayTotal.cardTransactionTotal += transaction.amount;
        dayTotal.hasCardTransactions = true;
      } else if (transaction.paymentType === 'bank') {
        dayTotal.bankTransactionTotal += transaction.amount;
        dayTotal.hasBankTransactions = true;
      }
    });
    
    // Process schedule items
    if (schedule) {
      schedule.items.forEach(item => {
        const dateKey = formatDateISO(item.date);
        
        if (!totals.has(dateKey)) {
          totals.set(dateKey, createEmptyDayTotal(dateKey));
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

  // 指定した日付の合計データを取得
  const getDayTotal = (date: Date): DayTotalData | undefined => {
    const dateKey = formatDateISO(date);
    return dayTotals.get(dateKey);
  };

  // 指定した日付にデータがあるかチェック
  const hasDayData = (date: Date): boolean => {
    const dayTotal = getDayTotal(date);
    return dayTotal ? dayTotal.hasData : false;
  };

  // 月の合計金額を計算
  const getMonthTotal = (): number => {
    let total = 0;
    dayTotals.forEach(dayTotal => {
      total += dayTotal.totalAmount;
    });
    return total;
  };

  return {
    dayTotals,
    getDayTotal,
    hasDayData,
    getMonthTotal
  };
}

/**
 * 空の日別合計データを作成するヘルパー関数
 */
function createEmptyDayTotal(dateKey: string): DayTotalData {
  return {
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
    hasSchedule: false
  };
}