/**
 * Enhanced Transaction Slice Tests
 * Comprehensive testing for Zustand transaction state management
 * Phase 3 production-ready validation with async operations and caching
 */

import { act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockTransactionInput,
  createMockBank,
  createMockCard,
  createMockDataSet,
  createAsyncMock,
  createErrorMock,
} from '../../utils/testUtils';
import {
  createTestStore,
  createStoreActionTester,
  createStoreSubscriptionTester,
  createStoreAssertions,
  measureStoreActionPerformance,
  createRealisticTestData,
  StoreTestWrapper,
} from '../../utils/storeTestUtils';
import { AppStore } from '@/store/types';
import { Transaction, TransactionInput, Bank, Card } from '@/types/database';

// Mock database operations with realistic async behavior
const createMockDatabaseOperations = () => ({
  transactionOperations: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getFiltered: jest.fn(),
  },
  bankOperations: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  cardOperations: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getByBankId: jest.fn(),
  },
});

// Mock the database modules
jest.mock('@/lib/database', () => {
  const mockOps = createMockDatabaseOperations();
  return {
    transactionOperations: mockOps.transactionOperations,
    bankOperations: mockOps.bankOperations,
    cardOperations: mockOps.cardOperations,
  };
});

describe('Enhanced Transaction Slice Tests', () => {
  let store: StoreTestWrapper['store'];
  let actionTester: ReturnType<typeof createStoreActionTester>;
  let subscriptionTester: ReturnType<typeof createStoreSubscriptionTester>;
  let assertions: ReturnType<typeof createStoreAssertions>;
  let mockOps: ReturnType<typeof createMockDatabaseOperations>;

  beforeEach(() => {
    store = createTestStore();
    actionTester = createStoreActionTester(store);
    subscriptionTester = createStoreSubscriptionTester(store);
    assertions = createStoreAssertions();
    mockOps = createMockDatabaseOperations();
    
    // Setup default mock implementations
    mockOps.transactionOperations.getAll.mockResolvedValue([]);
    mockOps.transactionOperations.getFiltered.mockResolvedValue([]);
    mockOps.bankOperations.getAll.mockResolvedValue([]);
    mockOps.cardOperations.getAll.mockResolvedValue([]);
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    subscriptionTester.cleanup();
    if (store.destroy) {
      store.destroy();
    }
  });

  describe('Initial State Validation', () => {
    it('should have empty transactions initially', () => {
      const state = store.getState();
      expect(state.transactions).toEqual([]);
      expect(Array.isArray(state.transactions)).toBe(true);
    });

    it('should have empty banks and cards initially', () => {
      const state = store.getState();
      expect(state.banks).toEqual([]);
      expect(state.cards).toEqual([]);
      expect(Array.isArray(state.banks)).toBe(true);
      expect(Array.isArray(state.cards)).toBe(true);
    });

    it('should have proper loading states initially', () => {
      const state = store.getState();
      expect(state.loading.transactions).toBe(false);
      expect(state.loading.banks).toBe(false);
      expect(state.loading.cards).toBe(false);
      expect(typeof state.loading).toBe('object');
    });

    it('should have no errors initially', () => {
      const state = store.getState();
      expect(state.errors.transactions).toBeNull();
      expect(state.errors.banks).toBeNull();
      expect(state.errors.cards).toBeNull();
      expect(typeof state.errors).toBe('object');
    });

    it('should have empty transaction cache initially', () => {
      const state = store.getState();
      expect(state.transactionCache).toEqual({});
      expect(typeof state.transactionCache).toBe('object');
    });

    it('should have all required action methods', () => {
      const state = store.getState();
      expect(typeof state.actions.fetchTransactions).toBe('function');
      expect(typeof state.actions.createTransaction).toBe('function');
      expect(typeof state.actions.updateTransaction).toBe('function');
      expect(typeof state.actions.deleteTransaction).toBe('function');
      expect(typeof state.actions.fetchBanks).toBe('function');
      expect(typeof state.actions.fetchCards).toBe('function');
    });
  });

  describe('Transaction CRUD Operations', () => {
    it('should create a new transaction with proper state updates', async () => {
      const mockInput = createMockTransactionInput();
      const mockTransaction = createMockTransaction(mockInput);
      
      // Mock database operation
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.create.mockResolvedValue(mockTransaction);

      await act(async () => {
        actionTester.captureAction('createTransaction', mockInput);
        await store.getState().actions.createTransaction(mockInput);
      });

      const state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 1);
      expect(state.transactions[0]).toEqual(mockTransaction);
      expect(transactionOperations.create).toHaveBeenCalledWith(mockInput);
      
      // Verify loading states were managed correctly
      expect(state.loading.transactions).toBe(false);
      
      // Verify subscription was triggered
      const subscriptionCalls = subscriptionTester.getSubscriptionCalls();
      expect(subscriptionCalls.length).toBeGreaterThan(0);
    });

    it('should fetch transactions with caching mechanism', async () => {
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-2' })];
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue(mockTransactions);

      // First fetch - should call database
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      let state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 2);
      expect(transactionOperations.getFiltered).toHaveBeenCalledTimes(1);
      
      // Verify cache was populated
      const cacheKeys = Object.keys(state.transactionCache);
      expect(cacheKeys.length).toBe(1);
      expect(state.transactionCache[cacheKeys[0]].data).toEqual(mockTransactions);

      // Second fetch - should use cache
      transactionOperations.getFiltered.mockClear();
      
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      expect(transactionOperations.getFiltered).not.toHaveBeenCalled();
      state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 2);
    });

    it('should update an existing transaction and invalidate cache', async () => {
      const mockTransaction = createMockTransaction();
      const updatedTransaction = { ...mockTransaction, amount: 10000 };
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.update.mockResolvedValue(updatedTransaction);

      // Setup initial state
      await act(() => {
        store.setState({ transactions: [mockTransaction] });
      });

      await act(async () => {
        actionTester.captureAction('updateTransaction', {
          id: mockTransaction.id,
          updates: { amount: 10000 },
        });
        
        await store.getState().actions.updateTransaction(mockTransaction.id, { amount: 10000 });
      });

      const state = store.getState();
      expect(state.transactions[0].amount).toBe(10000);
      expect(transactionOperations.update).toHaveBeenCalledWith(mockTransaction.id, { amount: 10000 });
      
      // Verify cache was invalidated
      expect(state.transactionCache).toEqual({});
    });

    it('should delete a transaction and update state correctly', async () => {
      const mockTransaction1 = createMockTransaction({ id: 'tx-1' });
      const mockTransaction2 = createMockTransaction({ id: 'tx-2' });
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.delete.mockResolvedValue(undefined);

      // Setup initial state with multiple transactions
      await act(() => {
        store.setState({ transactions: [mockTransaction1, mockTransaction2] });
      });

      await act(async () => {
        actionTester.captureAction('deleteTransaction', { id: mockTransaction1.id });
        await store.getState().actions.deleteTransaction(mockTransaction1.id);
      });

      const state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 1);
      expect(state.transactions[0].id).toBe('tx-2');
      expect(transactionOperations.delete).toHaveBeenCalledWith(mockTransaction1.id);
      
      // Verify cache was invalidated
      expect(state.transactionCache).toEqual({});
    });

    it('should fetch transaction by ID and update existing transaction in list', async () => {
      const originalTransaction = createMockTransaction({ amount: 5000 });
      const updatedTransaction = { ...originalTransaction, amount: 8000 };
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getById.mockResolvedValue(updatedTransaction);

      // Setup initial state
      await act(() => {
        store.setState({ transactions: [originalTransaction] });
      });

      await act(async () => {
        await store.getState().actions.fetchTransactionById(originalTransaction.id);
      });

      const state = store.getState();
      expect(state.transactions[0].amount).toBe(8000);
      expect(transactionOperations.getById).toHaveBeenCalledWith(originalTransaction.id);
    });
  });

  describe('Async Operations & Error Handling', () => {
    it('should handle loading states during fetch operations', async () => {
      const mockTransactions = [createMockTransaction()];
      
      const { transactionOperations } = require('@/lib/database');
      // Create a delayed promise to test loading states
      transactionOperations.getFiltered.mockImplementation(() => 
        new Promise(resolve => {
          setTimeout(() => resolve(mockTransactions), 50);
        })
      );

      const fetchPromise = act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      // Check loading state was set
      let state = store.getState();
      expect(state.loading.transactions).toBe(true);

      await fetchPromise;

      // Check final state
      state = store.getState();
      expect(state.loading.transactions).toBe(false);
      assertions.assertArrayLength(store, 'transactions', 1);
      expect(state.errors.transactions).toBeNull();
    });

    it('should handle errors during transaction creation', async () => {
      const mockInput = createMockTransactionInput();
      const errorMessage = 'Database connection failed';
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.create.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        try {
          await store.getState().actions.createTransaction(mockInput);
        } catch (error) {
          // Expected error
        }
      });

      const state = store.getState();
      expect(state.errors.transactions).toBe(errorMessage);
      expect(state.loading.transactions).toBe(false);
      assertions.assertArrayLength(store, 'transactions', 0); // Should remain empty
    });

    it('should handle network timeouts gracefully', async () => {
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockImplementation(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Network timeout')), 100);
        })
      );

      await act(async () => {
        try {
          await store.getState().actions.fetchTransactions();
        } catch (error) {
          // Expected timeout
        }
      });

      const state = store.getState();
      expect(state.errors.transactions).toBe('Network timeout');
      expect(state.loading.transactions).toBe(false);
    });

    it('should handle concurrent async operations correctly', async () => {
      const mockTransactions1 = [createMockTransaction({ id: 'tx-1' })];
      const mockTransactions2 = [createMockTransaction({ id: 'tx-2' })];
      
      const { transactionOperations } = require('@/lib/database');
      let callCount = 0;
      transactionOperations.getFiltered.mockImplementation(() => 
        new Promise(resolve => {
          const transactions = callCount === 0 ? mockTransactions1 : mockTransactions2;
          callCount++;
          setTimeout(() => resolve(transactions), Math.random() * 50);
        })
      );

      // Start two concurrent fetches
      const [result1, result2] = await Promise.all([
        act(async () => store.getState().actions.fetchTransactions()),
        act(async () => store.getState().actions.fetchTransactions()),
      ]);

      const state = store.getState();
      expect(state.loading.transactions).toBe(false);
      assertions.assertArrayLength(store, 'transactions', 1);
      
      // Should have cached one of the results
      expect(Object.keys(state.transactionCache).length).toBeGreaterThan(0);
    });

    it('should handle partial failures in batch operations', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];
      
      const { transactionOperations } = require('@/lib/database');
      let deleteCallCount = 0;
      transactionOperations.delete.mockImplementation((id) => {
        deleteCallCount++;
        if (id === 'tx-1') {
          return Promise.resolve();
        } else {
          return Promise.reject(new Error('Delete failed for tx-2'));
        }
      });

      // Setup initial state
      await act(() => {
        store.setState({ transactions: mockTransactions });
      });

      // Try to delete first transaction (should succeed)
      await act(async () => {
        await store.getState().actions.deleteTransaction('tx-1');
      });

      let state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 1);
      expect(state.transactions[0].id).toBe('tx-2');

      // Try to delete second transaction (should fail)
      await act(async () => {
        try {
          await store.getState().actions.deleteTransaction('tx-2');
        } catch (error) {
          // Expected failure
        }
      });

      state = store.getState();
      expect(state.errors.transactions).toBe('Delete failed for tx-2');
      assertions.assertArrayLength(store, 'transactions', 1); // Should still be there
    });
  });

  describe('Performance & Optimization Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const { generateTransactionBatch } = createRealisticTestData();
      const largeDataset = generateTransactionBatch(1000, {
        start: new Date('2024-01-01'),
        end: new Date('2024-12-31'),
      });
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue(largeDataset);

      const result = await measureStoreActionPerformance(
        async () => {
          await act(async () => {
            await store.getState().actions.fetchTransactions();
          });
        },
        10,
        { warmupIterations: 2, collectDetailedTimings: true }
      );

      const state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 1000);
      expect(result.averageTime).toBeLessThan(100); // Should handle large datasets efficiently
    });

    it('should handle rapid consecutive CRUD operations', async () => {
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.create.mockImplementation((input) => 
        Promise.resolve(createMockTransaction(input))
      );
      transactionOperations.update.mockImplementation((id, updates) => 
        Promise.resolve({ ...createMockTransaction({ id }), ...updates })
      );
      transactionOperations.delete.mockResolvedValue(undefined);

      const result = await measureStoreActionPerformance(
        async () => {
          await act(async () => {
            const input = createMockTransactionInput();
            await store.getState().actions.createTransaction(input);
            
            const state = store.getState();
            if (state.transactions.length > 0) {
              const transaction = state.transactions[0];
              await store.getState().actions.updateTransaction(transaction.id, { amount: 10000 });
              await store.getState().actions.deleteTransaction(transaction.id);
            }
          });
        },
        25,
        { warmupIterations: 5 }
      );

      expect(result.averageTime).toBeLessThan(50); // Should handle rapid operations efficiently
    });

    it('should optimize cache performance with complex filters', async () => {
      const mockTransactions = [
        createMockTransaction({ date: '2024-01-15' }),
        createMockTransaction({ date: '2024-02-15' }),
        createMockTransaction({ date: '2024-03-15' }),
      ];
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockImplementation((filters) => {
        // Simulate filtering logic
        let result = mockTransactions;
        if (filters?.dateRange) {
          result = mockTransactions.filter(t => 
            new Date(t.date).getTime() >= filters.dateRange.start &&
            new Date(t.date).getTime() <= filters.dateRange.end
          );
        }
        return Promise.resolve(result);
      });

      const filters1 = {
        dateRange: {
          start: new Date('2024-01-01').getTime(),
          end: new Date('2024-01-31').getTime(),
        },
      };
      
      const filters2 = {
        dateRange: {
          start: new Date('2024-02-01').getTime(),
          end: new Date('2024-02-28').getTime(),
        },
      };

      // Test multiple filter combinations
      await act(async () => {
        await store.getState().actions.fetchTransactions(filters1);
        await store.getState().actions.fetchTransactions(filters2);
        await store.getState().actions.fetchTransactions(filters1); // Should use cache
      });

      const state = store.getState();
      
      // Should have cached both filter combinations
      const cacheKeys = Object.keys(state.transactionCache);
      expect(cacheKeys.length).toBe(2);
      
      // Database should have been called only twice (not three times)
      expect(transactionOperations.getFiltered).toHaveBeenCalledTimes(2);
    });

    it('should handle memory-intensive operations without leaks', async () => {
      const { transactionOperations } = require('@/lib/database');
      
      // Create a large transaction and repeat operations
      const largeTransaction = createMockTransaction({
        description: 'A'.repeat(10000), // Large description
      });
      
      transactionOperations.create.mockResolvedValue(largeTransaction);
      transactionOperations.delete.mockResolvedValue(undefined);

      const iterations = 50;
      for (let i = 0; i < iterations; i++) {
        await act(async () => {
          await store.getState().actions.createTransaction(createMockTransactionInput({
            description: `Large transaction ${i}`,
          }));
          
          const state = store.getState();
          if (state.transactions.length > 0) {
            await store.getState().actions.deleteTransaction(state.transactions[0].id);
          }
        });
      }

      const state = store.getState();
      // Should end with clean state
      assertions.assertArrayLength(store, 'transactions', 0);
      expect(state.errors.transactions).toBeNull();
    });
  });

  describe('Cache Management & Optimization', () => {
    it('should implement intelligent caching with TTL', async () => {
      const mockTransactions = [createMockTransaction()];
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue(mockTransactions);

      // First fetch - should call database
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      let state = store.getState();
      expect(transactionOperations.getFiltered).toHaveBeenCalledTimes(1);
      
      // Verify cache structure
      const cacheKeys = Object.keys(state.transactionCache);
      expect(cacheKeys.length).toBe(1);
      const cacheItem = state.transactionCache[cacheKeys[0]];
      expect(cacheItem.data).toEqual(mockTransactions);
      expect(cacheItem.timestamp).toBeGreaterThan(0);
      expect(cacheItem.expiresAt).toBeGreaterThan(Date.now());

      // Second fetch within TTL - should use cache
      transactionOperations.getFiltered.mockClear();
      
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      expect(transactionOperations.getFiltered).not.toHaveBeenCalled();
      state = store.getState();
      assertions.assertArrayLength(store, 'transactions', 1);
    });

    it('should invalidate cache after mutations and refresh data', async () => {
      const originalTransaction = createMockTransaction();
      const updatedTransaction = { ...originalTransaction, amount: 15000 };
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue([originalTransaction]);
      transactionOperations.update.mockResolvedValue(updatedTransaction);

      // Initial fetch to populate cache
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      let state = store.getState();
      expect(Object.keys(state.transactionCache).length).toBe(1);

      // Update transaction - should invalidate cache
      await act(async () => {
        await store.getState().actions.updateTransaction(originalTransaction.id, { amount: 15000 });
      });

      state = store.getState();
      expect(state.transactionCache).toEqual({}); // Cache should be cleared
      expect(state.transactions[0].amount).toBe(15000);
    });

    it('should handle cache invalidation with specific keys', async () => {
      const mockTransactions1 = [createMockTransaction({ id: 'tx-1' })];
      const mockTransactions2 = [createMockTransaction({ id: 'tx-2' })];
      
      const { transactionOperations } = require('@/lib/database');
      
      // Mock different responses for different filters
      transactionOperations.getFiltered.mockImplementation((filters) => {
        if (filters?.dateRange?.start === 1) {
          return Promise.resolve(mockTransactions1);
        } else {
          return Promise.resolve(mockTransactions2);
        }
      });

      // Fetch with different filters to create multiple cache entries
      await act(async () => {
        await store.getState().actions.fetchTransactions({ dateRange: { start: 1, end: 100 } });
        await store.getState().actions.fetchTransactions({ dateRange: { start: 200, end: 300 } });
      });

      let state = store.getState();
      expect(Object.keys(state.transactionCache).length).toBe(2);

      // Invalidate specific cache key
      const firstCacheKey = Object.keys(state.transactionCache)[0];
      await act(() => {
        store.getState().actions.invalidateTransactionCache(firstCacheKey);
      });

      state = store.getState();
      expect(Object.keys(state.transactionCache).length).toBe(1);
      expect(state.transactionCache[firstCacheKey]).toBeUndefined();
    });

    it('should clear all cache when requested', async () => {
      const mockTransactions = [createMockTransaction()];
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue(mockTransactions);

      // Create multiple cache entries
      await act(async () => {
        await store.getState().actions.fetchTransactions();
        await store.getState().actions.fetchTransactions({ dateRange: { start: 1, end: 100 } });
      });

      let state = store.getState();
      expect(Object.keys(state.transactionCache).length).toBe(2);

      // Clear all cache
      await act(() => {
        store.getState().actions.clearTransactionCache();
      });

      state = store.getState();
      expect(state.transactionCache).toEqual({});
    });

    it('should handle expired cache entries correctly', async () => {
      const mockTransactions = [createMockTransaction()];
      
      const { transactionOperations } = require('@/lib/database');
      transactionOperations.getFiltered.mockResolvedValue(mockTransactions);

      // Initial fetch
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      // Manually expire the cache by modifying the timestamp
      await act(() => {
        const state = store.getState();
        const cacheKey = Object.keys(state.transactionCache)[0];
        const expiredCache = {
          ...state.transactionCache,
          [cacheKey]: {
            ...state.transactionCache[cacheKey],
            expiresAt: Date.now() - 1000, // Expired 1 second ago
          },
        };
        store.setState({ transactionCache: expiredCache });
      });

      // Next fetch should call database again
      transactionOperations.getFiltered.mockClear();
      
      await act(async () => {
        await store.getState().actions.fetchTransactions();
      });

      expect(transactionOperations.getFiltered).toHaveBeenCalledTimes(1);
    });
  });

  describe('Bank & Card Operations Integration', () => {
    it('should fetch banks and cards for transaction forms', async () => {
      const mockBanks = [createMockBank(), createMockBank({ id: 'bank-2' })];
      const mockCards = [createMockCard(), createMockCard({ id: 'card-2' })];
      
      const { bankOperations, cardOperations } = require('@/lib/database');
      bankOperations.getAll.mockResolvedValue(mockBanks);
      cardOperations.getAll.mockResolvedValue(mockCards);

      await act(async () => {
        await store.getState().actions.fetchBanks();
        await store.getState().actions.fetchCards();
      });

      const state = store.getState();
      assertions.assertArrayLength(store, 'banks', 2);
      assertions.assertArrayLength(store, 'cards', 2);
      expect(state.banks[0].name).toBe('テスト銀行');
      expect(state.cards[0].name).toBe('テストカード');
    });

    it('should fetch cards by bank ID and merge correctly', async () => {
      const bank1Cards = [createMockCard({ id: 'card-1', bankId: 'bank-1' })];
      const bank2Cards = [createMockCard({ id: 'card-2', bankId: 'bank-2' })];
      
      const { cardOperations } = require('@/lib/database');
      
      // Setup initial cards for bank 1
      await act(() => {
        store.setState({ cards: bank1Cards });
      });

      // Fetch cards for bank 2
      cardOperations.getByBankId.mockResolvedValue(bank2Cards);
      
      await act(async () => {
        await store.getState().actions.fetchCardsByBank('bank-2');
      });

      const state = store.getState();
      assertions.assertArrayLength(store, 'cards', 2);
      expect(state.cards.find(c => c.bankId === 'bank-1')).toBeDefined();
      expect(state.cards.find(c => c.bankId === 'bank-2')).toBeDefined();
    });
  });

  describe('Data Query & Filter Operations', () => {
    it('should provide filtering and calculation helpers', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1', amount: 1000, bankId: 'bank-1', cardId: null }),
        createMockTransaction({ id: 'tx-2', amount: 2000, bankId: null, cardId: 'card-1' }),
        createMockTransaction({ id: 'tx-3', amount: 3000, bankId: 'bank-2', cardId: null }),
      ];
      
      await act(() => {
        store.setState({ transactions: mockTransactions });
      });

      const state = store.getState();
      
      // Test bank filtering
      const bankTransactions = store.getState().actions.getTransactionsByBank('bank-1');
      expect(bankTransactions).toHaveLength(1);
      expect(bankTransactions[0].id).toBe('tx-1');
      
      // Test card filtering
      const cardTransactions = store.getState().actions.getTransactionsByCard('card-1');
      expect(cardTransactions).toHaveLength(1);
      expect(cardTransactions[0].id).toBe('tx-2');
      
      // Test total calculation
      const total = store.getState().actions.calculateTransactionTotal(mockTransactions);
      expect(total).toBe(6000);
    });

    it('should handle date range filtering correctly', async () => {
      const jan15 = new Date('2024-01-15').getTime();
      const feb15 = new Date('2024-02-15').getTime();
      const mar15 = new Date('2024-03-15').getTime();
      
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1', date: jan15 }),
        createMockTransaction({ id: 'tx-2', date: feb15 }),
        createMockTransaction({ id: 'tx-3', date: mar15 }),
      ];
      
      await act(() => {
        store.setState({ transactions: mockTransactions });
      });

      // Test date range filtering
      const jan1 = new Date('2024-01-01').getTime();
      const feb28 = new Date('2024-02-28').getTime();
      
      const filteredTransactions = store.getState().actions.getTransactionsByDateRange(jan1, feb28);
      expect(filteredTransactions).toHaveLength(2);
      expect(filteredTransactions.map(t => t.id)).toEqual(['tx-1', 'tx-2']);
    });
  });
});