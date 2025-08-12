'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bank,
  Card,
  Transaction,
  BankInput,
  CardInput,
  TransactionInput,
  MonthlySchedule,
  TransactionFilters,
  DatabaseOperationError
} from '@/types/database';
import {
  getDatabase,
  bankOperations,
  cardOperations,
  transactionOperations
} from '@/lib/database';

/**
 * Hook state interfaces
 */
interface DatabaseState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface ListDatabaseState<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Cache management
 */
class DatabaseCache {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes
  
  set<T>(key: string, data: T, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data as T;
  }
  
  invalidate(pattern: string): void {
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

const dbCache = new DatabaseCache();

/**
 * Bank operations hook
 */
export function useBanks() {
  const [state, setState] = useState<ListDatabaseState<Bank>>({
    data: [],
    isLoading: false,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController>();
  
  const fetchBanks = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Try cache first
      const cached = dbCache.get<Bank[]>('banks');
      if (cached) {
        setState({ data: cached, isLoading: false, error: null });
        return cached;
      }
      
      const banks = await bankOperations.getAll();
      
      if (!abortControllerRef.current.signal.aborted) {
        setState({ data: banks, isLoading: false, error: null });
        dbCache.set('banks', banks);
      }
      
      return banks;
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        const dbError = error instanceof DatabaseOperationError 
          ? error 
          : new DatabaseOperationError('Failed to fetch banks', error);
        setState(prev => ({ ...prev, isLoading: false, error: dbError }));
      }
      throw error;
    }
  }, []);
  
  const createBank = useCallback(async (bankData: BankInput): Promise<Bank> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Optimistic update
      const optimisticBank: Bank = {
        id: `temp-${Date.now()}`,
        ...bankData,
        createdAt: Date.now()
      };
      
      setState(prev => ({
        ...prev,
        data: [...prev.data, optimisticBank]
      }));
      
      const newBank = await bankOperations.create(bankData);
      
      // Replace optimistic update with real data
      setState(prev => ({
        ...prev,
        data: prev.data.map(bank => 
          bank.id === optimisticBank.id ? newBank : bank
        )
      }));
      
      // Invalidate cache
      dbCache.invalidate('banks');
      
      return newBank;
    } catch (error) {
      // Rollback optimistic update
      setState(prev => ({
        ...prev,
        data: prev.data.filter(bank => !bank.id.startsWith('temp-')),
        error: error instanceof Error ? error : new Error('Failed to create bank')
      }));
      throw error;
    }
  }, []);
  
  const updateBank = useCallback(async (id: string, updates: Partial<BankInput>): Promise<Bank> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Store original for rollback
      const originalBanks = state.data;
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        data: prev.data.map(bank => 
          bank.id === id ? { ...bank, ...updates } : bank
        )
      }));
      
      const updatedBank = await bankOperations.update(id, updates);
      
      // Update with real data
      setState(prev => ({
        ...prev,
        data: prev.data.map(bank => 
          bank.id === id ? updatedBank : bank
        )
      }));
      
      // Invalidate cache
      dbCache.invalidate('banks');
      
      return updatedBank;
    } catch (error) {
      // Rollback
      setState(prev => ({
        ...prev,
        data: originalBanks,
        error: error instanceof Error ? error : new Error('Failed to update bank')
      }));
      throw error;
    }
  }, []);
  
  const deleteBank = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      // Store original for rollback
      const originalBanks = state.data;
      
      // Optimistic update
      setState(prev => ({
        ...prev,
        data: prev.data.filter(bank => bank.id !== id)
      }));
      
      await bankOperations.delete(id);
      
      // Invalidate cache
      dbCache.invalidate('banks');
    } catch (error) {
      // Rollback
      setState(prev => ({
        ...prev,
        data: originalBanks,
        error: error instanceof Error ? error : new Error('Failed to delete bank')
      }));
      throw error;
    }
  }, []);
  
  useEffect(() => {
    fetchBanks();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    banks: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchBanks,
    createBank,
    updateBank,
    deleteBank
  };
}

/**
 * Card operations hook
 */
export function useCards(bankId?: string) {
  const [state, setState] = useState<ListDatabaseState<Card>>({
    data: [],
    isLoading: false,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController>();
  
  const fetchCards = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const cacheKey = bankId ? `cards-bank-${bankId}` : 'cards';
      const cached = dbCache.get<Card[]>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null });
        return cached;
      }
      
      const cards = bankId 
        ? await cardOperations.getByBankId(bankId)
        : await cardOperations.getAll();
      
      if (!abortControllerRef.current.signal.aborted) {
        setState({ data: cards, isLoading: false, error: null });
        dbCache.set(cacheKey, cards);
      }
      
      return cards;
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        const dbError = error instanceof DatabaseOperationError 
          ? error 
          : new DatabaseOperationError('Failed to fetch cards', error);
        setState(prev => ({ ...prev, isLoading: false, error: dbError }));
      }
      throw error;
    }
  }, [bankId]);
  
  const createCard = useCallback(async (cardData: CardInput): Promise<Card> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const optimisticCard: Card = {
        id: `temp-${Date.now()}`,
        ...cardData,
        createdAt: Date.now()
      };
      
      setState(prev => ({
        ...prev,
        data: [...prev.data, optimisticCard]
      }));
      
      const newCard = await cardOperations.create(cardData);
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(card => 
          card.id === optimisticCard.id ? newCard : card
        )
      }));
      
      dbCache.invalidate('cards');
      
      return newCard;
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: prev.data.filter(card => !card.id.startsWith('temp-')),
        error: error instanceof Error ? error : new Error('Failed to create card')
      }));
      throw error;
    }
  }, []);
  
  const updateCard = useCallback(async (id: string, updates: Partial<CardInput>): Promise<Card> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const originalCards = state.data;
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(card => 
          card.id === id ? { ...card, ...updates } : card
        )
      }));
      
      const updatedCard = await cardOperations.update(id, updates);
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(card => 
          card.id === id ? updatedCard : card
        )
      }));
      
      dbCache.invalidate('cards');
      
      return updatedCard;
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: originalCards,
        error: error instanceof Error ? error : new Error('Failed to update card')
      }));
      throw error;
    }
  }, []);
  
  const deleteCard = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const originalCards = state.data;
      
      setState(prev => ({
        ...prev,
        data: prev.data.filter(card => card.id !== id)
      }));
      
      await cardOperations.delete(id);
      
      dbCache.invalidate('cards');
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: originalCards,
        error: error instanceof Error ? error : new Error('Failed to delete card')
      }));
      throw error;
    }
  }, []);
  
  useEffect(() => {
    fetchCards();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    cards: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchCards,
    createCard,
    updateCard,
    deleteCard
  };
}

/**
 * Transaction operations hook
 */
export function useTransactions(filters?: TransactionFilters) {
  const [state, setState] = useState<ListDatabaseState<Transaction>>({
    data: [],
    isLoading: false,
    error: null
  });
  
  const abortControllerRef = useRef<AbortController>();
  
  const fetchTransactions = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const cacheKey = `transactions-${JSON.stringify(filters || {})}`;
      const cached = dbCache.get<Transaction[]>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null });
        return cached;
      }
      
      const transactions = await transactionOperations.getFiltered(filters);
      
      if (!abortControllerRef.current.signal.aborted) {
        setState({ data: transactions, isLoading: false, error: null });
        dbCache.set(cacheKey, transactions, 2 * 60 * 1000); // Shorter cache for transactions
      }
      
      return transactions;
    } catch (error) {
      if (!abortControllerRef.current.signal.aborted) {
        const dbError = error instanceof DatabaseOperationError 
          ? error 
          : new DatabaseOperationError('Failed to fetch transactions', error);
        setState(prev => ({ ...prev, isLoading: false, error: dbError }));
      }
      throw error;
    }
  }, [filters]);
  
  const createTransaction = useCallback(async (transactionData: TransactionInput): Promise<Transaction> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const optimisticTransaction: Transaction = {
        id: `temp-${Date.now()}`,
        ...transactionData,
        scheduledPayDate: Date.now(), // Temporary value, will be replaced with calculated value
        createdAt: Date.now()
      };
      
      setState(prev => ({
        ...prev,
        data: [optimisticTransaction, ...prev.data]
      }));
      
      const newTransaction = await transactionOperations.create(transactionData);
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(transaction => 
          transaction.id === optimisticTransaction.id ? newTransaction : transaction
        )
      }));
      
      dbCache.invalidate('transactions');
      dbCache.invalidate('schedule');
      
      return newTransaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: prev.data.filter(transaction => !transaction.id.startsWith('temp-')),
        error: error instanceof Error ? error : new Error('Failed to create transaction')
      }));
      throw error;
    }
  }, []);
  
  const updateTransaction = useCallback(async (id: string, updates: Partial<TransactionInput>): Promise<Transaction> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const originalTransactions = state.data;
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(transaction => 
          transaction.id === id ? { ...transaction, ...updates } : transaction
        )
      }));
      
      const updatedTransaction = await transactionOperations.update(id, updates);
      
      setState(prev => ({
        ...prev,
        data: prev.data.map(transaction => 
          transaction.id === id ? updatedTransaction : transaction
        )
      }));
      
      dbCache.invalidate('transactions');
      dbCache.invalidate('schedule');
      
      return updatedTransaction;
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: originalTransactions,
        error: error instanceof Error ? error : new Error('Failed to update transaction')
      }));
      throw error;
    }
  }, []);
  
  const deleteTransaction = useCallback(async (id: string): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const originalTransactions = state.data;
      
      setState(prev => ({
        ...prev,
        data: prev.data.filter(transaction => transaction.id !== id)
      }));
      
      await transactionOperations.delete(id);
      
      dbCache.invalidate('transactions');
      dbCache.invalidate('schedule');
    } catch (error) {
      setState(prev => ({
        ...prev,
        data: originalTransactions,
        error: error instanceof Error ? error : new Error('Failed to delete transaction')
      }));
      throw error;
    }
  }, []);
  
  useEffect(() => {
    fetchTransactions();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  return {
    transactions: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
  };
}

/**
 * Monthly schedule hook
 */
export function useMonthlySchedule(year: number, month: number) {
  const [state, setState] = useState<DatabaseState<MonthlySchedule>>({
    data: null,
    isLoading: false,
    error: null
  });
  
  const fetchSchedule = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const cacheKey = `schedule-${year}-${month}`;
      const cached = dbCache.get<MonthlySchedule>(cacheKey);
      if (cached) {
        setState({ data: cached, isLoading: false, error: null });
        return cached;
      }
      
      const schedule = await transactionOperations.getMonthlySchedule(year, month);
      
      setState({ data: schedule, isLoading: false, error: null });
      dbCache.set(cacheKey, schedule, 10 * 60 * 1000); // Cache for 10 minutes
      
      return schedule;
    } catch (error) {
      const dbError = error instanceof DatabaseOperationError 
        ? error 
        : new DatabaseOperationError('Failed to fetch schedule', error);
      setState(prev => ({ ...prev, isLoading: false, error: dbError }));
      throw error;
    }
  }, [year, month]);
  
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);
  
  return {
    schedule: state.data,
    isLoading: state.isLoading,
    error: state.error,
    refetch: fetchSchedule
  };
}

/**
 * Database statistics hook
 */
export function useDatabaseStats() {
  const [stats, setStats] = useState({
    banks: 0,
    cards: 0,
    transactions: 0,
    totalSize: 0
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const db = getDatabase();
      const statistics = await db.getStatistics();
      setStats(statistics);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch statistics'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const clearAllData = useCallback(async () => {
    try {
      setError(null);
      
      const db = getDatabase();
      await db.clearAllData();
      
      // Clear all caches
      dbCache.clear();
      
      // Update stats immediately
      setStats({
        banks: 0,
        cards: 0,
        transactions: 0,
        totalSize: 0
      });
      
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to clear all data'));
      throw err;
    }
  }, []);
  
  useEffect(() => {
    fetchStats();
  }, []);
  
  return {
    stats,
    isLoading,
    error,
    refetch: fetchStats,
    clearAllData
  };
}