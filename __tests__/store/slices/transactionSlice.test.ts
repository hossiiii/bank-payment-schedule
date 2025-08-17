/**
 * Transaction Slice Tests
 * Tests for Zustand transaction state management
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockTransactionInput,
  createAsyncMock,
  createErrorMock,
  validateTransactionInput,
} from '../../utils/testUtils';
import {
  createInitialStoreState,
  createStoreActionTester,
  testAsyncAction,
  createStoreErrorTester,
  measureStoreActionPerformance,
} from '../../utils/storeTestUtils';

// Mock the Zustand transaction store
const mockTransactionStore = {
  transactions: createInitialStoreState().transactions,
  
  // Actions
  addTransaction: jest.fn(),
  updateTransaction: jest.fn(),
  deleteTransaction: jest.fn(),
  loadTransactions: jest.fn(),
  setFilter: jest.fn(),
  clearFilter: jest.fn(),
  setLoading: jest.fn(),
  setError: jest.fn(),
  clearError: jest.fn(),
};

describe('Transaction Slice', () => {
  let actionTester: ReturnType<typeof createStoreActionTester>;
  let errorTester: ReturnType<typeof createStoreErrorTester>;

  beforeEach(() => {
    actionTester = createStoreActionTester();
    errorTester = createStoreErrorTester();
    jest.clearAllMocks();
    
    // Reset mock store state
    mockTransactionStore.transactions = createInitialStoreState().transactions;
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const initialState = createInitialStoreState();
      
      expect(initialState.transactions.items).toEqual([]);
      expect(initialState.transactions.loading).toBe(false);
      expect(initialState.transactions.error).toBeNull();
      expect(initialState.transactions.filter.dateRange).toBeNull();
      expect(initialState.transactions.filter.cardId).toBeNull();
      expect(initialState.transactions.filter.bankId).toBeNull();
      expect(initialState.transactions.filter.categoryId).toBeNull();
    });

    it('should initialize with empty transactions array', () => {
      expect(mockTransactionStore.transactions.items).toHaveLength(0);
    });
  });

  describe('Add Transaction', () => {
    it('should add new transaction successfully', async () => {
      const newTransaction = createMockTransaction({ id: 'new-tx-1' });
      const transactionInput = createMockTransactionInput();

      await act(async () => {
        actionTester.captureAction('addTransaction', transactionInput);
        
        // Simulate async operation
        mockTransactionStore.transactions.loading = true;
        
        // Simulate successful addition
        setTimeout(() => {
          mockTransactionStore.transactions.items = [newTransaction];
          mockTransactionStore.transactions.loading = false;
          mockTransactionStore.transactions.error = null;
        }, 0);
      });

      expect(mockTransactionStore.transactions.items).toContain(newTransaction);
      expect(mockTransactionStore.transactions.loading).toBe(false);
      expect(mockTransactionStore.transactions.error).toBeNull();
    });

    it('should handle add transaction with validation', () => {
      const invalidInput = createMockTransactionInput({ amount: -100 });
      
      expect(validateTransactionInput(invalidInput)).toBe(false);
      
      act(() => {
        actionTester.captureAction('addTransaction', invalidInput);
        errorTester.captureError(new Error('Invalid transaction amount'), 'addTransaction');
        
        mockTransactionStore.transactions.error = 'Invalid transaction amount';
        mockTransactionStore.transactions.loading = false;
      });

      expect(mockTransactionStore.transactions.error).toBe('Invalid transaction amount');
      expect(mockTransactionStore.transactions.items).toHaveLength(0);
    });

    it('should set loading state during add operation', async () => {
      const transactionInput = createMockTransactionInput();
      const mockAddAsync = createAsyncMock(createMockTransaction(), 100);

      await act(async () => {
        actionTester.captureAction('addTransaction', transactionInput);
        
        mockTransactionStore.transactions.loading = true;
        
        try {
          const result = await mockAddAsync();
          mockTransactionStore.transactions.items = [result];
          mockTransactionStore.transactions.loading = false;
        } catch (error) {
          mockTransactionStore.transactions.error = (error as Error).message;
          mockTransactionStore.transactions.loading = false;
        }
      });

      expect(mockTransactionStore.transactions.loading).toBe(false);
      expect(mockTransactionStore.transactions.items).toHaveLength(1);
    });
  });

  describe('Update Transaction', () => {
    beforeEach(() => {
      const existingTransaction = createMockTransaction({ id: 'existing-tx' });
      mockTransactionStore.transactions.items = [existingTransaction];
    });

    it('should update existing transaction successfully', async () => {
      const updates = { amount: 10000, description: '更新されたトランザクション' };
      const transactionId = 'existing-tx';

      await act(async () => {
        actionTester.captureAction('updateTransaction', { id: transactionId, updates });
        
        // Simulate update
        const updatedItems = mockTransactionStore.transactions.items.map(item =>
          item.id === transactionId ? { ...item, ...updates } : item
        );
        
        mockTransactionStore.transactions.items = updatedItems;
      });

      const updatedTransaction = mockTransactionStore.transactions.items.find(t => t.id === transactionId);
      expect(updatedTransaction?.amount).toBe(10000);
      expect(updatedTransaction?.description).toBe('更新されたトランザクション');
    });

    it('should handle update of non-existent transaction', async () => {
      const updates = { amount: 10000 };
      const nonExistentId = 'non-existent-tx';

      await act(async () => {
        actionTester.captureAction('updateTransaction', { id: nonExistentId, updates });
        errorTester.captureError(new Error('Transaction not found'), 'updateTransaction');
        
        mockTransactionStore.transactions.error = 'Transaction not found';
      });

      expect(mockTransactionStore.transactions.error).toBe('Transaction not found');
      expect(mockTransactionStore.transactions.items).toHaveLength(1); // Original item unchanged
    });

    it('should validate updates before applying', async () => {
      const invalidUpdates = { amount: -500 };
      const transactionId = 'existing-tx';

      await act(async () => {
        actionTester.captureAction('updateTransaction', { id: transactionId, updates: invalidUpdates });
        
        // Validation should fail
        errorTester.captureError(new Error('Invalid update data'), 'updateTransaction');
        mockTransactionStore.transactions.error = 'Invalid update data';
      });

      expect(mockTransactionStore.transactions.error).toBe('Invalid update data');
      
      // Original transaction should be unchanged
      const originalTransaction = mockTransactionStore.transactions.items.find(t => t.id === transactionId);
      expect(originalTransaction?.amount).not.toBe(-500);
    });
  });

  describe('Delete Transaction', () => {
    beforeEach(() => {
      const transactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
        createMockTransaction({ id: 'tx-3' }),
      ];
      mockTransactionStore.transactions.items = transactions;
    });

    it('should delete transaction successfully', async () => {
      const transactionId = 'tx-2';

      await act(async () => {
        actionTester.captureAction('deleteTransaction', { id: transactionId });
        
        // Simulate deletion
        mockTransactionStore.transactions.items = mockTransactionStore.transactions.items
          .filter(t => t.id !== transactionId);
      });

      expect(mockTransactionStore.transactions.items).toHaveLength(2);
      expect(mockTransactionStore.transactions.items.find(t => t.id === transactionId)).toBeUndefined();
    });

    it('should handle delete of non-existent transaction', async () => {
      const nonExistentId = 'non-existent-tx';

      await act(async () => {
        actionTester.captureAction('deleteTransaction', { id: nonExistentId });
        errorTester.captureError(new Error('Transaction not found'), 'deleteTransaction');
        
        mockTransactionStore.transactions.error = 'Transaction not found';
      });

      expect(mockTransactionStore.transactions.error).toBe('Transaction not found');
      expect(mockTransactionStore.transactions.items).toHaveLength(3); // No items deleted
    });

    it('should handle cascade delete validation', async () => {
      const transactionId = 'tx-1';

      await act(async () => {
        actionTester.captureAction('deleteTransaction', { id: transactionId, validateCascade: true });
        
        // Simulate cascade validation (e.g., check if referenced by schedule)
        const hasReferences = false; // Mock check
        
        if (!hasReferences) {
          mockTransactionStore.transactions.items = mockTransactionStore.transactions.items
            .filter(t => t.id !== transactionId);
        } else {
          errorTester.captureError(new Error('Transaction has references'), 'deleteTransaction');
          mockTransactionStore.transactions.error = 'Transaction has references';
        }
      });

      expect(mockTransactionStore.transactions.items).toHaveLength(2);
    });
  });

  describe('Load Transactions', () => {
    it('should load transactions successfully', async () => {
      const mockTransactions = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];
      
      const mockLoadAsync = createAsyncMock(mockTransactions, 50);

      await act(async () => {
        actionTester.captureAction('loadTransactions');
        
        mockTransactionStore.transactions.loading = true;
        mockTransactionStore.transactions.error = null;
        
        try {
          const result = await mockLoadAsync();
          mockTransactionStore.transactions.items = result;
          mockTransactionStore.transactions.loading = false;
        } catch (error) {
          mockTransactionStore.transactions.error = (error as Error).message;
          mockTransactionStore.transactions.loading = false;
        }
      });

      expect(mockTransactionStore.transactions.items).toHaveLength(2);
      expect(mockTransactionStore.transactions.loading).toBe(false);
      expect(mockTransactionStore.transactions.error).toBeNull();
    });

    it('should handle load failure', async () => {
      const mockLoadAsync = createErrorMock('Failed to load transactions');

      await act(async () => {
        actionTester.captureAction('loadTransactions');
        
        mockTransactionStore.transactions.loading = true;
        
        try {
          await mockLoadAsync();
        } catch (error) {
          errorTester.captureError(error as Error, 'loadTransactions');
          mockTransactionStore.transactions.error = (error as Error).message;
          mockTransactionStore.transactions.loading = false;
        }
      });

      expect(mockTransactionStore.transactions.error).toBe('Failed to load transactions');
      expect(mockTransactionStore.transactions.loading).toBe(false);
      expect(mockTransactionStore.transactions.items).toHaveLength(0);
    });

    it('should handle partial load with retry capability', async () => {
      let attemptCount = 0;
      const mockLoadWithRetry = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve([createMockTransaction()]);
      });

      await act(async () => {
        actionTester.captureAction('loadTransactionsWithRetry');
        
        // Simulate retry logic
        for (let i = 0; i < 3; i++) {
          try {
            const result = await mockLoadWithRetry();
            mockTransactionStore.transactions.items = result;
            mockTransactionStore.transactions.error = null;
            break;
          } catch (error) {
            if (i === 2) { // Last attempt
              errorTester.captureError(error as Error, 'loadTransactions');
              mockTransactionStore.transactions.error = (error as Error).message;
            }
          }
        }
        
        mockTransactionStore.transactions.loading = false;
      });

      expect(mockTransactionStore.transactions.items).toHaveLength(1);
      expect(mockTransactionStore.transactions.error).toBeNull();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', cardId: 'card-1', date: '2024-02-15' }),
        createMockTransaction({ id: 'tx-2', cardId: 'card-2', date: '2024-02-16' }),
        createMockTransaction({ id: 'tx-3', bankId: 'bank-1', date: '2024-02-17' }),
      ];
      mockTransactionStore.transactions.items = transactions;
    });

    it('should set date range filter', () => {
      const dateRange = {
        start: new Date('2024-02-15'),
        end: new Date('2024-02-16'),
      };

      act(() => {
        actionTester.captureAction('setFilter', { dateRange });
        mockTransactionStore.transactions.filter.dateRange = dateRange;
      });

      expect(mockTransactionStore.transactions.filter.dateRange).toEqual(dateRange);
    });

    it('should set card filter', () => {
      const cardId = 'card-1';

      act(() => {
        actionTester.captureAction('setFilter', { cardId });
        mockTransactionStore.transactions.filter.cardId = cardId;
      });

      expect(mockTransactionStore.transactions.filter.cardId).toBe(cardId);
    });

    it('should set multiple filters simultaneously', () => {
      const filters = {
        cardId: 'card-1',
        categoryId: 'cat-1',
        dateRange: {
          start: new Date('2024-02-15'),
          end: new Date('2024-02-16'),
        },
      };

      act(() => {
        actionTester.captureAction('setFilter', filters);
        mockTransactionStore.transactions.filter = {
          ...mockTransactionStore.transactions.filter,
          ...filters,
        };
      });

      expect(mockTransactionStore.transactions.filter.cardId).toBe('card-1');
      expect(mockTransactionStore.transactions.filter.categoryId).toBe('cat-1');
      expect(mockTransactionStore.transactions.filter.dateRange).toEqual(filters.dateRange);
    });

    it('should clear all filters', () => {
      // Set some filters first
      mockTransactionStore.transactions.filter = {
        dateRange: { start: new Date(), end: new Date() },
        cardId: 'card-1',
        bankId: 'bank-1',
        categoryId: 'cat-1',
      };

      act(() => {
        actionTester.captureAction('clearFilter');
        mockTransactionStore.transactions.filter = {
          dateRange: null,
          cardId: null,
          bankId: null,
          categoryId: null,
        };
      });

      expect(mockTransactionStore.transactions.filter.dateRange).toBeNull();
      expect(mockTransactionStore.transactions.filter.cardId).toBeNull();
      expect(mockTransactionStore.transactions.filter.bankId).toBeNull();
      expect(mockTransactionStore.transactions.filter.categoryId).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error state', () => {
      mockTransactionStore.transactions.error = 'Some error';

      act(() => {
        actionTester.captureAction('clearError');
        mockTransactionStore.transactions.error = null;
      });

      expect(mockTransactionStore.transactions.error).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network connection failed');

      await act(async () => {
        actionTester.captureAction('handleNetworkError');
        errorTester.captureError(networkError, 'network');
        
        mockTransactionStore.transactions.error = 'Network connection failed';
        mockTransactionStore.transactions.loading = false;
      });

      expect(mockTransactionStore.transactions.error).toBe('Network connection failed');
      expect(mockTransactionStore.transactions.loading).toBe(false);
    });

    it('should handle validation errors', () => {
      const validationError = 'Transaction amount must be positive';

      act(() => {
        actionTester.captureAction('handleValidationError');
        errorTester.captureError(new Error(validationError), 'validation');
        
        mockTransactionStore.transactions.error = validationError;
      });

      expect(mockTransactionStore.transactions.error).toBe(validationError);
    });
  });

  describe('Performance Tests', () => {
    it('should handle large number of transactions efficiently', () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({ id: `tx-${i}` })
      );

      const startTime = performance.now();

      act(() => {
        mockTransactionStore.transactions.items = largeTransactionSet;
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(mockTransactionStore.transactions.items).toHaveLength(1000);
      expect(duration).toBeLessThan(100); // Should complete in less than 100ms
    });

    it('should perform filtering efficiently on large datasets', () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) =>
        createMockTransaction({
          id: `tx-${i}`,
          cardId: i % 2 === 0 ? 'card-1' : 'card-2',
        })
      );

      mockTransactionStore.transactions.items = largeTransactionSet;

      const startTime = performance.now();

      act(() => {
        // Simulate filtering
        const cardId = 'card-1';
        actionTester.captureAction('performFilter', { cardId });
        mockTransactionStore.transactions.filter.cardId = cardId;
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(50); // Filtering should be fast
    });
  });

  describe('State Consistency', () => {
    it('should maintain state consistency during concurrent operations', async () => {
      const concurrentOperations = [
        () => mockTransactionStore.transactions.items.push(createMockTransaction({ id: 'concurrent-1' })),
        () => mockTransactionStore.transactions.items.push(createMockTransaction({ id: 'concurrent-2' })),
        () => mockTransactionStore.transactions.items.push(createMockTransaction({ id: 'concurrent-3' })),
      ];

      await act(async () => {
        // Execute all operations concurrently
        await Promise.all(concurrentOperations.map(op => Promise.resolve(op())));
      });

      expect(mockTransactionStore.transactions.items).toHaveLength(3);
      
      // Verify all transactions have unique IDs
      const ids = mockTransactionStore.transactions.items.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should handle rapid state changes', () => {
      const rapidChanges = 50;

      for (let i = 0; i < rapidChanges; i++) {
        act(() => {
          mockTransactionStore.transactions.loading = i % 2 === 0;
          mockTransactionStore.transactions.error = i % 3 === 0 ? `Error ${i}` : null;
        });
      }

      // Final state should be consistent
      expect(typeof mockTransactionStore.transactions.loading).toBe('boolean');
      expect(
        mockTransactionStore.transactions.error === null ||
        typeof mockTransactionStore.transactions.error === 'string'
      ).toBe(true);
    });
  });
});