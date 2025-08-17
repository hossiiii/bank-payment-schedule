import { StateCreator } from 'zustand';
import { 
  TransactionSlice, 
  TransactionCache, 
  CACHE_DURATIONS,
  LoadingStates,
  AppStore 
} from '../types';
import { 
  Transaction, 
  TransactionInput, 
  Bank, 
  Card, 
  TransactionFilters
} from '@/types/database';
import { 
  bankOperations, 
  cardOperations, 
  transactionOperations 
} from '@/lib/database';

// Cache utilities
const createCacheKey = (filters?: TransactionFilters): string => {
  return `transactions-${JSON.stringify(filters || {})}`;
};

const isCacheValid = (cache: TransactionCache, key: string): boolean => {
  const item = cache[key];
  return Boolean(item && Date.now() < item.expiresAt);
};

const setCacheItem = (
  cache: TransactionCache, 
  key: string, 
  data: Transaction[]
): void => {
  const now = Date.now();
  cache[key] = {
    data,
    timestamp: now,
    expiresAt: now + CACHE_DURATIONS.TRANSACTIONS,
  };
};

export const createTransactionSlice: StateCreator<
  AppStore,
  [],
  [],
  TransactionSlice
> = (set, get) => ({
  transactions: [],
  transactionCache: {},
  banks: [],
  cards: [],
  
  transactionActions: {
    // Fetch transactions with optional filters
    fetchTransactions: async (filters?: { dateRange?: { start: number; end: number } }) => {
      const { uiActions } = get();
      
      return await uiActions.withAsyncOperation('transactions', async () => {
        const state = get();
        const cacheKey = createCacheKey(filters);
        
        // Check cache first
        if (isCacheValid(state.transactionCache, cacheKey)) {
          const cachedData = state.transactionCache[cacheKey]?.data;
          if (cachedData) {
            set({ transactions: cachedData });
            return cachedData;
          }
        }
        
        // Fetch from database
        const transactionFilters: TransactionFilters | undefined = filters && filters.dateRange ? {
          dateRange: filters.dateRange,
        } : undefined;
        
        const transactions = await transactionOperations.getFiltered(transactionFilters);
        
        // Update state and cache
        set((state) => {
          const newCache = { ...state.transactionCache };
          setCacheItem(newCache, cacheKey, transactions);
          
          return {
            transactions,
            transactionCache: newCache,
          };
        });
        
        return transactions;
      });
    },

    // Fetch a single transaction by ID
    fetchTransactionById: async (id: string) => {
      const { uiActions } = get();
      
      return await uiActions.withAsyncOperation('transactions', async () => {
        const transaction = await transactionOperations.getById(id);
        
        if (transaction) {
          // Update the transaction in the current list if it exists
          set((state) => ({
            transactions: state.transactions.map(t => 
              t.id === id ? transaction : t
            ),
          }));
        }
        
        return transaction || null;
      });
    },

    // Create a new transaction
    createTransaction: async (input: TransactionInput) => {
      const { uiActions, modalActions } = get();
      
      await uiActions.withAsyncOperation('saving', async () => {
        const newTransaction = await transactionOperations.create(input);
        
        // Optimistically update state
        set((state) => ({
          transactions: [newTransaction, ...state.transactions],
        }));
        
        // Invalidate cache
        get().transactionActions.invalidateTransactionCache();
        
        // Close modals on successful save
        modalActions.closeAllModals();
        
        return newTransaction;
      });
    },

    // Update an existing transaction
    updateTransaction: async (id: string, updates: Partial<Transaction>) => {
      const { uiActions, modalActions } = get();
      
      await uiActions.withAsyncOperation('saving', async () => {
        const updatedTransaction = await transactionOperations.update(id, updates);
        
        // Update state
        set((state) => ({
          transactions: state.transactions.map(t => 
            t.id === id ? updatedTransaction : t
          ),
        }));
        
        // Invalidate cache
        get().transactionActions.invalidateTransactionCache();
        
        // Close modals on successful save
        modalActions.closeAllModals();
        
        return updatedTransaction;
      });
    },

    // Delete a transaction
    deleteTransaction: async (id: string) => {
      const { uiActions, modalActions } = get();
      
      await uiActions.withAsyncOperation('deleting', async () => {
        await transactionOperations.delete(id);
        
        // Remove from state
        set((state) => ({
          transactions: state.transactions.filter(t => t.id !== id),
        }));
        
        // Invalidate cache
        get().transactionActions.invalidateTransactionCache();
        
        // Close modals on successful delete
        modalActions.closeAllModals();
      });
    },

    // Cache management
    invalidateTransactionCache: (key?: string) => {
      set((state) => {
        if (key) {
          const newCache = { ...state.transactionCache };
          delete newCache[key];
          return { transactionCache: newCache };
        } else {
          return { transactionCache: {} };
        }
      });
    },

    clearTransactionCache: () => {
      set({ transactionCache: {} });
    },

    // Cross-store operations
    withAsyncOperation: async <T>(
      operationKey: keyof LoadingStates,
      operation: () => Promise<T>
    ): Promise<T> => {
      const { uiActions } = get();
      return await uiActions.withAsyncOperation(operationKey, operation);
    },
  },
});

// Additional actions for banks and cards that transaction slice needs
export const createTransactionHelpers = (get: () => AppStore, set: (partial: Partial<AppStore>) => void) => ({
  // Fetch banks for transaction forms
  fetchBanks: async (): Promise<Bank[]> => {
    const { uiActions } = get();
    
    return await uiActions.withAsyncOperation('banks', async () => {
      const banks = await bankOperations.getAll();
      set({ banks });
      return banks;
    });
  },

  // Fetch cards for transaction forms
  fetchCards: async (): Promise<Card[]> => {
    const { uiActions } = get();
    
    return await uiActions.withAsyncOperation('cards', async () => {
      const cards = await cardOperations.getAll();
      set({ cards });
      return cards;
    });
  },

  // Fetch cards for a specific bank
  fetchCardsByBank: async (bankId: string): Promise<Card[]> => {
    const { uiActions } = get();
    
    return await uiActions.withAsyncOperation('cards', async () => {
      const cards = await cardOperations.getByBankId(bankId);
      
      // Update cards in state, merging with existing cards from other banks
      set({ 
        cards: [...get().cards.filter(c => c.bankId !== bankId), ...cards]
      });
      
      return cards;
    });
  },

  // Get transactions by date range
  getTransactionsByDateRange: (start: number, end: number): Transaction[] => {
    return get().transactions.filter(
      transaction => transaction.date >= start && transaction.date <= end
    );
  },

  // Get transactions by payment type
  getTransactionsByPaymentType: (paymentType: 'bank' | 'card'): Transaction[] => {
    return get().transactions.filter(
      transaction => transaction.paymentType === paymentType
    );
  },

  // Get transactions by bank ID
  getTransactionsByBank: (bankId: string): Transaction[] => {
    return get().transactions.filter(
      transaction => transaction.bankId === bankId
    );
  },

  // Get transactions by card ID
  getTransactionsByCard: (cardId: string): Transaction[] => {
    return get().transactions.filter(
      transaction => transaction.cardId === cardId
    );
  },

  // Calculate total amount for filtered transactions
  calculateTransactionTotal: (transactions: Transaction[]): number => {
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
  },
});