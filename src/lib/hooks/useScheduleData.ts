'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  PaymentScheduleView,
  UseScheduleDataResult,
  ScheduleCalculationParams,
  ScheduleError
} from '@/types/schedule';
import { Transaction, Card, DatabaseOperationError } from '@/types/database';
import { transformToPaymentScheduleView, validatePaymentScheduleView } from '@/lib/utils/scheduleUtils';
import { useBanks, useCards, useTransactions } from './useDatabase';

/**
 * Cache management for schedule data
 */
class ScheduleCache {
  private cache = new Map<string, { 
    data: PaymentScheduleView; 
    timestamp: number; 
    dependencies: { transactions: string; banks: string; cards: string }
  }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  private generateDependencyHash(transactions: Transaction[], banks: any[], cards: Card[]): {
    transactions: string;
    banks: string; 
    cards: string;
  } {
    const transactionsHash = transactions.map(t => `${t.id}-${t.amount}-${t.scheduledPayDate}`).join('|');
    const banksHash = banks.map(b => `${b.id}-${b.name}`).join('|');
    const cardsHash = cards.map(c => `${c.id}-${c.name}-${c.closingDay}-${c.paymentDay}`).join('|');
    
    return {
      transactions: this.hashString(transactionsHash),
      banks: this.hashString(banksHash),
      cards: this.hashString(cardsHash)
    };
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  set(
    key: string, 
    data: PaymentScheduleView,
    transactions: Transaction[],
    banks: any[],
    cards: Card[]
  ): void {
    const dependencies = this.generateDependencyHash(transactions, banks, cards);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      dependencies
    });
  }

  get(
    key: string,
    transactions: Transaction[],
    banks: any[],
    cards: Card[]
  ): PaymentScheduleView | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > this.defaultTTL) {
      this.cache.delete(key);
      return null;
    }

    // Check dependencies
    const currentDependencies = this.generateDependencyHash(transactions, banks, cards);
    if (
      item.dependencies.transactions !== currentDependencies.transactions ||
      item.dependencies.banks !== currentDependencies.banks ||
      item.dependencies.cards !== currentDependencies.cards
    ) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

const scheduleCache = new ScheduleCache();

/**
 * Hook for fetching and managing cross-table schedule data
 * Replaces useMonthlySchedule with PaymentScheduleView format
 */
export function useScheduleData(year: number, month: number): UseScheduleDataResult {
  const [state, setState] = useState<{
    data: PaymentScheduleView | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    data: null,
    isLoading: false,
    error: null
  });

  const abortControllerRef = useRef<AbortController>();

  // Fetch dependencies
  const { banks, isLoading: banksLoading, error: banksError } = useBanks();
  const { cards, isLoading: cardsLoading, error: cardsError } = useCards();
  
  // Filter transactions for this month and next month (for transactions that might affect this month's schedule)
  const dateRange = useMemo(() => {
    const startDate = new Date(year, month - 1, 1); // month is 1-indexed
    const endDate = new Date(year, month + 1, 0); // Last day of next month
    return {
      start: startDate.getTime(),
      end: endDate.getTime()
    };
  }, [year, month]);

  const { 
    transactions, 
    isLoading: transactionsLoading, 
    error: transactionsError 
  } = useTransactions({
    dateRange
  });

  const isLoading = banksLoading || cardsLoading || transactionsLoading;
  const error = banksError || cardsError || transactionsError;

  const calculateScheduleData = useCallback(async (): Promise<PaymentScheduleView> => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      // Check cache first
      const cacheKey = `schedule-${year}-${month}`;
      const cached = scheduleCache.get(cacheKey, transactions, banks, cards);
      if (cached) {
        return cached;
      }

      // Validate inputs
      if (!banks.length) {
        throw new ScheduleError(
          'No banks configured. Please add banks in settings.',
          'MISSING_BANK'
        );
      }

      if (!transactions.length) {
        // Return empty but valid structure
        const emptyResult: PaymentScheduleView = {
          month: `${year}年${month}月`,
          payments: [],
          bankTotals: new Map(),
          monthTotal: 0,
          uniqueBanks: []
        };
        scheduleCache.set(cacheKey, emptyResult, transactions, banks, cards);
        return emptyResult;
      }

      // Transform data using schedule utils
      const params: ScheduleCalculationParams = {
        transactions,
        banks,
        cards,
        year,
        month
      };

      const scheduleData = transformToPaymentScheduleView(params);

      // Validate the result
      const validation = validatePaymentScheduleView(scheduleData);
      if (!validation.isValid) {
        throw new ScheduleError(
          `Invalid schedule data: ${validation.errors.join(', ')}`,
          'CALCULATION_ERROR',
          { validationErrors: validation.errors }
        );
      }

      // Cache the result
      scheduleCache.set(cacheKey, scheduleData, transactions, banks, cards);

      return scheduleData;
    } catch (error) {
      if (error instanceof ScheduleError) {
        throw error;
      }
      
      throw new ScheduleError(
        `Failed to calculate schedule for ${year}年${month}月: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CALCULATION_ERROR',
        { originalError: error, year, month }
      );
    }
  }, [year, month, transactions, banks, cards]);

  const refetch = useCallback(async () => {
    if (error) {
      setState(prev => ({ ...prev, error: null }));
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const scheduleData = await calculateScheduleData();
      
      if (!abortControllerRef.current?.signal.aborted) {
        setState({
          data: scheduleData,
          isLoading: false,
          error: null
        });
      }
    } catch (err) {
      if (!abortControllerRef.current?.signal.aborted) {
        const processedError = err instanceof ScheduleError 
          ? err 
          : new DatabaseOperationError('Failed to load schedule data', err);
        
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: processedError
        }));
      }
    }
  }, [calculateScheduleData]);

  // Auto-fetch when dependencies change
  useEffect(() => {
    if (!isLoading && !error && banks.length > 0) {
      refetch();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [year, month, isLoading, error, banks.length, refetch]);

  // Handle dependency errors
  useEffect(() => {
    if (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error
      }));
    }
  }, [error]);

  return {
    scheduleData: state.data,
    isLoading: state.isLoading || isLoading,
    error: state.error,
    refetch
  };
}

/**
 * Hook for getting schedule data with real-time updates
 * Automatically refetches when underlying data changes
 */
export function useRealtimeScheduleData(year: number, month: number): UseScheduleDataResult {
  const result = useScheduleData(year, month);
  
  // Clear cache when data might be stale
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        scheduleCache.clear();
        result.refetch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [result.refetch]);

  return result;
}

/**
 * Hook for multiple months of schedule data (useful for yearly views)
 */
export function useMultiMonthScheduleData(
  startYear: number, 
  startMonth: number, 
  monthCount: number = 12
): {
  scheduleData: Map<string, PaymentScheduleView>;
  isLoading: boolean;
  error: Error | null;
  refetchAll: () => void;
} {
  const [allData, setAllData] = useState<Map<string, PaymentScheduleView>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const newData = new Map<string, PaymentScheduleView>();
    
    try {
      // This is a simplified implementation - in a real app you might want to batch these
      for (let i = 0; i < monthCount; i++) {
        const date = new Date(startYear, startMonth - 1 + i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        
        // Note: This would need to be implemented properly with actual data fetching
        // For now, it's a placeholder that shows the pattern
        // const key = `${year}-${month}`;
        // const data = await fetchScheduleForMonth(year, month);
        // newData.set(key, data);
      }
      
      setAllData(newData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch multi-month data'));
    } finally {
      setIsLoading(false);
    }
  }, [startYear, startMonth, monthCount]);

  useEffect(() => {
    refetchAll();
  }, [refetchAll]);

  return {
    scheduleData: allData,
    isLoading,
    error,
    refetchAll
  };
}

/**
 * Utility hook for cache management
 */
export function useScheduleCache() {
  const clearCache = useCallback(() => {
    scheduleCache.clear();
  }, []);

  const invalidateMonth = useCallback((year: number, month: number) => {
    scheduleCache.invalidatePattern(`schedule-${year}-${month}`);
  }, []);

  const invalidateAll = useCallback(() => {
    scheduleCache.clear();
  }, []);

  return {
    clearCache,
    invalidateMonth,
    invalidateAll
  };
}

/**
 * Export the cache instance for testing purposes
 */
export { scheduleCache };