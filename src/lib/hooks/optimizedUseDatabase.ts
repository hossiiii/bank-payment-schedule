import { useMemo, useCallback } from 'react';
import { 
  useAppStore, 
  useStoreActions, 
  selectors 
} from '@/store';
import { 
  Transaction, 
  TransactionInput, 
  Bank, 
  Card, 
  MonthlySchedule, 
  TransactionFilters 
} from '@/types/database';

/**
 * Optimized database hook that replaces the original useDatabase hooks
 * with performance optimizations using Zustand store and memoization
 */

// Optimized banks hook with memoization
export function useOptimizedBanks() {
  const banks = useAppStore(selectors.transaction.getBanks);
  const isLoading = useAppStore(selectors.ui.isLoading('banks'));
  const error = useAppStore(selectors.ui.getError('banks'));
  const { transaction } = useStoreActions();
  
  // Memoize the refetch function to prevent unnecessary re-renders
  const refetch = useCallback(() => {
    return transaction.fetchBanks();
  }, [transaction]);
  
  // Memoize CRUD operations
  const createBank = useCallback(async (bankData: any) => {
    // This would typically use the store's bank operations
    // For now, we'll delegate to the transaction actions
    throw new Error('Bank creation not implemented in store yet');
  }, []);
  
  const updateBank = useCallback(async (id: string, updates: any) => {
    throw new Error('Bank update not implemented in store yet');
  }, []);
  
  const deleteBank = useCallback(async (id: string) => {
    throw new Error('Bank deletion not implemented in store yet');
  }, []);
  
  return useMemo(() => ({
    banks,
    isLoading,
    error,
    refetch,
    createBank,
    updateBank,
    deleteBank,
  }), [banks, isLoading, error, refetch, createBank, updateBank, deleteBank]);
}

// Optimized cards hook with memoization
export function useOptimizedCards(bankId?: string) {
  const allCards = useAppStore(selectors.transaction.getCards);
  const isLoading = useAppStore(selectors.ui.isLoading('cards'));
  const error = useAppStore(selectors.ui.getError('cards'));
  const { transaction } = useStoreActions();
  
  // Memoize filtered cards when bankId is provided
  const cards = useMemo(() => {
    if (!bankId) return allCards;
    return selectors.transaction.getCardsByBank(useAppStore.getState(), bankId);
  }, [allCards, bankId]);
  
  const refetch = useCallback(() => {
    if (bankId) {
      return transaction.fetchCardsByBank(bankId);
    }
    return transaction.fetchCards();
  }, [transaction, bankId]);
  
  // Memoize CRUD operations
  const createCard = useCallback(async (cardData: any) => {
    throw new Error('Card creation not implemented in store yet');
  }, []);
  
  const updateCard = useCallback(async (id: string, updates: any) => {
    throw new Error('Card update not implemented in store yet');
  }, []);
  
  const deleteCard = useCallback(async (id: string) => {
    throw new Error('Card deletion not implemented in store yet');
  }, []);
  
  const bulkUpdateCards = useCallback(async (updates: Map<string, any>) => {
    throw new Error('Bulk card update not implemented in store yet');
  }, []);
  
  return useMemo(() => ({
    cards,
    isLoading,
    error,
    refetch,
    createCard,
    updateCard,
    deleteCard,
    bulkUpdateCards,
  }), [cards, isLoading, error, refetch, createCard, updateCard, deleteCard, bulkUpdateCards]);
}

// Optimized transactions hook with memoization
export function useOptimizedTransactions(filters?: TransactionFilters) {
  const allTransactions = useAppStore(selectors.transaction.getTransactions);
  const isLoading = useAppStore(selectors.ui.isLoading('transactions'));
  const error = useAppStore(selectors.ui.getError('transactions'));
  const { transaction } = useStoreActions();
  
  // Memoize filtered transactions
  const transactions = useMemo(() => {
    if (!filters) return allTransactions;
    
    let filtered = allTransactions;
    
    if (filters.dateRange) {
      filtered = selectors.transaction.getTransactionsByDateRange(
        useAppStore.getState(), 
        filters.dateRange.start, 
        filters.dateRange.end
      );
    }
    
    if (filters.paymentType) {
      filtered = filtered.filter(t => t.paymentType === filters.paymentType);
    }
    
    if (filters.bankId) {
      filtered = filtered.filter(t => t.bankId === filters.bankId);
    }
    
    if (filters.cardId) {
      filtered = filtered.filter(t => t.cardId === filters.cardId);
    }
    
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= filters.minAmount!);
    }
    
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= filters.maxAmount!);
    }
    
    return filtered;
  }, [allTransactions, filters]);
  
  const refetch = useCallback(() => {
    const fetchFilters = filters?.dateRange ? { dateRange: filters.dateRange } : undefined;
    return transaction.fetchTransactions(fetchFilters);
  }, [transaction, filters]);
  
  // Memoize CRUD operations
  const createTransaction = useCallback(async (transactionData: TransactionInput) => {
    return transaction.createTransaction(transactionData);
  }, [transaction]);
  
  const updateTransaction = useCallback(async (id: string, updates: Partial<TransactionInput>) => {
    return transaction.updateTransaction(id, updates);
  }, [transaction]);
  
  const deleteTransaction = useCallback(async (id: string) => {
    return transaction.deleteTransaction(id);
  }, [transaction]);
  
  const bulkUpdateTransactions = useCallback(async (updates: Map<string, { scheduledPayDate: number }>) => {
    // This would need to be implemented in the store
    throw new Error('Bulk transaction update not implemented in store yet');
  }, []);
  
  return useMemo(() => ({
    transactions,
    isLoading,
    error,
    refetch,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    bulkUpdateTransactions,
  }), [
    transactions, 
    isLoading, 
    error, 
    refetch, 
    createTransaction, 
    updateTransaction, 
    deleteTransaction, 
    bulkUpdateTransactions
  ]);
}

// Optimized monthly schedule hook with memoization
export function useOptimizedMonthlySchedule(year: number, month: number) {
  const schedule = useAppStore((state) => selectors.schedule.getMonthlySchedule(state, year, month));
  const isLoading = useAppStore(selectors.ui.isLoading('schedules'));
  const error = useAppStore(selectors.ui.getError('schedules'));
  const { schedule: scheduleActions } = useStoreActions();
  
  const refetch = useCallback(() => {
    return scheduleActions.fetchMonthlySchedule(year, month);
  }, [scheduleActions, year, month]);
  
  return useMemo(() => ({
    schedule,
    isLoading,
    error,
    refetch,
  }), [schedule, isLoading, error, refetch]);
}

// Optimized single transaction hook with memoization
export function useOptimizedTransaction(transactionId?: string) {
  const transaction = useAppStore((state) => 
    transactionId ? selectors.transaction.getTransactionById(state, transactionId) : null
  );
  const isLoading = useAppStore(selectors.ui.isLoading('transactions'));
  const error = useAppStore(selectors.ui.getError('transactions'));
  const { transaction: transactionActions } = useStoreActions();
  
  const refetch = useCallback(() => {
    if (!transactionId) return undefined;
    return () => transactionActions.fetchTransactionById(transactionId);
  }, [transactionActions, transactionId]);
  
  return useMemo(() => ({
    transaction,
    isLoading,
    error,
    refetch,
  }), [transaction, isLoading, error, refetch]);
}

// Optimized database stats hook (placeholder)
export function useOptimizedDatabaseStats() {
  // This would need to be implemented in the store
  // For now, return a placeholder
  return useMemo(() => ({
    stats: {
      banks: 0,
      cards: 0,
      transactions: 0,
      totalSize: 0,
    },
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve(),
    clearAllData: () => Promise.resolve(),
  }), []);
}

// Performance optimization utilities
export const optimizationUtils = {
  // Shallow comparison for objects
  shallowEqual: <T extends Record<string, any>>(obj1: T, obj2: T): boolean => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) {
      return false;
    }
    
    for (const key of keys1) {
      if (obj1[key] !== obj2[key]) {
        return false;
      }
    }
    
    return true;
  },
  
  // Debounce function for expensive operations
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number): T => {
    let timeout: NodeJS.Timeout;
    
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    }) as T;
  },
  
  // Throttle function for limiting function calls
  throttle: <T extends (...args: any[]) => any>(func: T, limit: number): T => {
    let inThrottle: boolean;
    
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },
};

// Memoized selectors for complex computations
export const memoizedSelectors = {
  // Memoized transaction totals by payment type
  useTransactionTotalsByType: () => {
    return useAppStore(useMemo(() => (state) => {
      const transactions = selectors.transaction.getTransactions(state);
      
      return transactions.reduce((acc, transaction) => {
        acc[transaction.paymentType] = (acc[transaction.paymentType] || 0) + transaction.amount;
        return acc;
      }, {} as Record<'card' | 'bank', number>);
    }, []));
  },
  
  // Memoized monthly transaction summaries
  useMonthlyTransactionSummary: (year: number, month: number) => {
    return useAppStore(useMemo(() => (state) => {
      const startOfMonth = new Date(year, month - 1, 1).getTime();
      const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999).getTime();
      
      const transactions = selectors.transaction.getTransactionsByDateRange(
        state, 
        startOfMonth, 
        endOfMonth
      );
      
      return {
        total: selectors.transaction.getTransactionTotal(state, transactions),
        count: transactions.length,
        byPaymentType: transactions.reduce((acc, t) => {
          acc[t.paymentType] = (acc[t.paymentType] || 0) + t.amount;
          return acc;
        }, {} as Record<'card' | 'bank', number>),
      };
    }, [year, month]));
  },
};