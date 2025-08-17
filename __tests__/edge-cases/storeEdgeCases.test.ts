/**
 * Store Edge Cases Tests
 * Tests for handling edge cases and boundary conditions
 * Phase 2 refactoring validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  createErrorMock,
} from '../utils/testUtils';
import {
  createInitialStoreState,
  createStoreErrorTester,
} from '../utils/storeTestUtils';

// Mock store with edge case handling
const createMockEdgeCaseStore = () => {
  let state = createInitialStoreState();
  const errorTester = createStoreErrorTester();
  
  const setState = (updater: (state: any) => any) => {
    try {
      const newState = updater(state);
      state = newState;
    } catch (error) {
      errorTester.captureError(error as Error, 'setState');
      // Don't update state on error
    }
  };
  
  const actions = {
    // Edge case operations
    addTransaction: (transaction: any) => {
      setState((prev: any) => {
        // Validate transaction data
        if (!transaction || typeof transaction !== 'object') {
          throw new Error('Invalid transaction data');
        }
        
        if (!transaction.id || typeof transaction.id !== 'string') {
          throw new Error('Transaction must have a valid ID');
        }
        
        if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
          throw new Error('Transaction amount must be a positive number');
        }
        
        // Check for duplicate IDs
        if (prev.transactions.items.some((tx: any) => tx.id === transaction.id)) {
          throw new Error('Transaction ID already exists');
        }
        
        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            items: [...prev.transactions.items, transaction],
          },
        };
      });
    },
    
    updateTransaction: (id: string, updates: any) => {
      setState((prev: any) => {
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid transaction ID');
        }
        
        const transactionIndex = prev.transactions.items.findIndex((tx: any) => tx.id === id);
        if (transactionIndex === -1) {
          throw new Error('Transaction not found');
        }
        
        if (!updates || typeof updates !== 'object') {
          throw new Error('Invalid update data');
        }
        
        // Validate critical fields if they're being updated
        if ('amount' in updates && (typeof updates.amount !== 'number' || updates.amount <= 0)) {
          throw new Error('Amount must be a positive number');
        }
        
        const updatedItems = [...prev.transactions.items];
        updatedItems[transactionIndex] = { ...updatedItems[transactionIndex], ...updates };
        
        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            items: updatedItems,
          },
        };
      });
    },
    
    deleteTransaction: (id: string) => {
      setState((prev: any) => {
        if (!id || typeof id !== 'string') {
          throw new Error('Invalid transaction ID');
        }
        
        const transactionExists = prev.transactions.items.some((tx: any) => tx.id === id);
        if (!transactionExists) {
          throw new Error('Transaction not found');
        }
        
        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            items: prev.transactions.items.filter((tx: any) => tx.id !== id),
          },
        };
      });
    },
    
    openModal: (modalType: string, data: any) => {
      setState((prev: any) => {
        if (!modalType || typeof modalType !== 'string') {
          throw new Error('Invalid modal type');
        }
        
        if (!prev.modals.hasOwnProperty(modalType)) {
          throw new Error(`Unknown modal type: ${modalType}`);
        }
        
        return {
          ...prev,
          modals: {
            ...prev.modals,
            [modalType]: { isOpen: true, data },
          },
        };
      });
    },
    
    setFilter: (filter: any) => {
      setState((prev: any) => {
        if (!filter || typeof filter !== 'object') {
          throw new Error('Invalid filter data');
        }
        
        // Validate date range if provided
        if (filter.dateRange) {
          if (!filter.dateRange.start || !filter.dateRange.end) {
            throw new Error('Date range must have both start and end dates');
          }
          
          const startDate = new Date(filter.dateRange.start);
          const endDate = new Date(filter.dateRange.end);
          
          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid dates in date range');
          }
          
          if (startDate > endDate) {
            throw new Error('Start date must be before end date');
          }
        }
        
        return {
          ...prev,
          transactions: {
            ...prev.transactions,
            filter: { ...prev.transactions.filter, ...filter },
          },
        };
      });
    },
    
    calculateDayTotals: (dateRange?: { start: Date; end: Date }) => {
      setState((prev: any) => {
        try {
          const transactions = prev.transactions.items;
          const schedules = prev.schedules.items;
          const dayTotals = new Map();
          
          // Handle empty datasets
          if (!transactions || !Array.isArray(transactions)) {
            return { ...prev, calendar: { ...prev.calendar, dayTotals } };
          }
          
          // Process each transaction
          transactions.forEach((tx: any) => {
            if (!tx || typeof tx !== 'object' || !tx.date) {
              return; // Skip invalid transactions
            }
            
            const date = tx.date;
            if (!dayTotals.has(date)) {
              dayTotals.set(date, {
                date,
                totalAmount: 0,
                transactionTotal: 0,
                scheduleTotal: 0,
                transactions: [],
                scheduleItems: [],
                transactionCount: 0,
                scheduleCount: 0,
                hasData: false,
                hasTransactions: false,
                hasSchedule: false,
              });
            }
            
            const dayTotal = dayTotals.get(date);
            dayTotal.totalAmount += tx.amount || 0;
            dayTotal.transactionTotal += tx.amount || 0;
            dayTotal.transactions.push(tx);
            dayTotal.transactionCount++;
            dayTotal.hasData = true;
            dayTotal.hasTransactions = true;
          });
          
          // Process schedules
          if (schedules && Array.isArray(schedules)) {
            schedules.forEach((sched: any) => {
              if (!sched || typeof sched !== 'object' || !sched.date) {
                return;
              }
              
              const date = sched.date;
              if (!dayTotals.has(date)) {
                dayTotals.set(date, {
                  date,
                  totalAmount: 0,
                  transactionTotal: 0,
                  scheduleTotal: 0,
                  transactions: [],
                  scheduleItems: [],
                  transactionCount: 0,
                  scheduleCount: 0,
                  hasData: false,
                  hasTransactions: false,
                  hasSchedule: false,
                });
              }
              
              const dayTotal = dayTotals.get(date);
              dayTotal.totalAmount += sched.amount || 0;
              dayTotal.scheduleTotal += sched.amount || 0;
              dayTotal.scheduleItems.push(sched);
              dayTotal.scheduleCount++;
              dayTotal.hasData = true;
              dayTotal.hasSchedule = true;
            });
          }
          
          return {
            ...prev,
            calendar: {
              ...prev.calendar,
              dayTotals,
            },
          };
        } catch (error) {
          errorTester.captureError(error as Error, 'calculateDayTotals');
          throw error;
        }
      });
    },
  };
  
  return {
    getState: () => state,
    setState,
    actions,
    errorTester,
  };
};

describe('Store Edge Cases Tests', () => {
  let mockStore: ReturnType<typeof createMockEdgeCaseStore>;

  beforeEach(() => {
    mockStore = createMockEdgeCaseStore();
  });

  describe('Invalid Data Handling', () => {
    it('should reject null transaction data', () => {
      expect(() => {
        mockStore.actions.addTransaction(null);
      }).toThrow('Invalid transaction data');
    });

    it('should reject undefined transaction data', () => {
      expect(() => {
        mockStore.actions.addTransaction(undefined);
      }).toThrow('Invalid transaction data');
    });

    it('should reject transaction without ID', () => {
      expect(() => {
        mockStore.actions.addTransaction({ amount: 1000, description: 'Test' });
      }).toThrow('Transaction must have a valid ID');
    });

    it('should reject transaction with invalid amount', () => {
      expect(() => {
        mockStore.actions.addTransaction({
          id: 'test-tx',
          amount: -1000,
          description: 'Test',
        });
      }).toThrow('Transaction amount must be a positive number');
    });

    it('should reject transaction with zero amount', () => {
      expect(() => {
        mockStore.actions.addTransaction({
          id: 'test-tx',
          amount: 0,
          description: 'Test',
        });
      }).toThrow('Transaction amount must be a positive number');
    });

    it('should reject transaction with non-numeric amount', () => {
      expect(() => {
        mockStore.actions.addTransaction({
          id: 'test-tx',
          amount: 'invalid',
          description: 'Test',
        });
      }).toThrow('Transaction amount must be a positive number');
    });
  });

  describe('Duplicate Data Handling', () => {
    it('should reject duplicate transaction IDs', () => {
      const transaction = createMockTransaction({ id: 'duplicate-id' });
      
      mockStore.actions.addTransaction(transaction);
      
      expect(() => {
        mockStore.actions.addTransaction(transaction);
      }).toThrow('Transaction ID already exists');
    });

    it('should handle duplicate ID attempts gracefully', () => {
      const transaction1 = createMockTransaction({ id: 'same-id', amount: 1000 });
      const transaction2 = createMockTransaction({ id: 'same-id', amount: 2000 });
      
      mockStore.actions.addTransaction(transaction1);
      
      expect(() => {
        mockStore.actions.addTransaction(transaction2);
      }).toThrow('Transaction ID already exists');
      
      // First transaction should still be in store
      const state = mockStore.getState();
      expect(state.transactions.items).toHaveLength(1);
      expect(state.transactions.items[0].amount).toBe(1000);
    });
  });

  describe('Non-existent Data Operations', () => {
    it('should handle updating non-existent transaction', () => {
      expect(() => {
        mockStore.actions.updateTransaction('non-existent-id', { amount: 5000 });
      }).toThrow('Transaction not found');
    });

    it('should handle deleting non-existent transaction', () => {
      expect(() => {
        mockStore.actions.deleteTransaction('non-existent-id');
      }).toThrow('Transaction not found');
    });

    it('should handle updating with invalid ID', () => {
      expect(() => {
        mockStore.actions.updateTransaction('', { amount: 5000 });
      }).toThrow('Invalid transaction ID');
    });

    it('should handle deleting with null ID', () => {
      expect(() => {
        mockStore.actions.deleteTransaction(null as any);
      }).toThrow('Invalid transaction ID');
    });
  });

  describe('Invalid Update Operations', () => {
    beforeEach(() => {
      const transaction = createMockTransaction({ id: 'update-test' });
      mockStore.actions.addTransaction(transaction);
    });

    it('should reject update with null data', () => {
      expect(() => {
        mockStore.actions.updateTransaction('update-test', null);
      }).toThrow('Invalid update data');
    });

    it('should reject update with invalid amount', () => {
      expect(() => {
        mockStore.actions.updateTransaction('update-test', { amount: -5000 });
      }).toThrow('Amount must be a positive number');
    });

    it('should allow partial updates with valid data', () => {
      mockStore.actions.updateTransaction('update-test', { description: 'Updated description' });
      
      const state = mockStore.getState();
      const updatedTransaction = state.transactions.items.find((tx: any) => tx.id === 'update-test');
      expect(updatedTransaction.description).toBe('Updated description');
    });
  });

  describe('Modal Edge Cases', () => {
    it('should reject invalid modal type', () => {
      expect(() => {
        mockStore.actions.openModal('', {});
      }).toThrow('Invalid modal type');
    });

    it('should reject unknown modal type', () => {
      expect(() => {
        mockStore.actions.openModal('unknownModal', {});
      }).toThrow('Unknown modal type: unknownModal');
    });

    it('should handle null modal data gracefully', () => {
      mockStore.actions.openModal('transaction', null);
      
      const state = mockStore.getState();
      expect(state.modals.transaction.isOpen).toBe(true);
      expect(state.modals.transaction.data).toBeNull();
    });

    it('should handle undefined modal data gracefully', () => {
      mockStore.actions.openModal('transaction', undefined);
      
      const state = mockStore.getState();
      expect(state.modals.transaction.isOpen).toBe(true);
      expect(state.modals.transaction.data).toBeUndefined();
    });
  });

  describe('Date Range Edge Cases', () => {
    it('should reject invalid date range', () => {
      expect(() => {
        mockStore.actions.setFilter({
          dateRange: { start: 'invalid-date', end: 'invalid-date' },
        });
      }).toThrow('Invalid dates in date range');
    });

    it('should reject date range with start after end', () => {
      expect(() => {
        mockStore.actions.setFilter({
          dateRange: {
            start: new Date('2024-02-15'),
            end: new Date('2024-02-10'),
          },
        });
      }).toThrow('Start date must be before end date');
    });

    it('should reject incomplete date range', () => {
      expect(() => {
        mockStore.actions.setFilter({
          dateRange: { start: new Date('2024-02-15') },
        });
      }).toThrow('Date range must have both start and end dates');
    });

    it('should handle same start and end date', () => {
      const date = new Date('2024-02-15');
      
      expect(() => {
        mockStore.actions.setFilter({
          dateRange: { start: date, end: date },
        });
      }).toThrow('Start date must be before end date');
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle maximum safe integer amount', () => {
      const transaction = createMockTransaction({
        id: 'max-amount',
        amount: Number.MAX_SAFE_INTEGER,
      });
      
      mockStore.actions.addTransaction(transaction);
      
      const state = mockStore.getState();
      expect(state.transactions.items[0].amount).toBe(Number.MAX_SAFE_INTEGER);
    });

    it('should handle very small positive amount', () => {
      const transaction = createMockTransaction({
        id: 'small-amount',
        amount: 0.01,
      });
      
      mockStore.actions.addTransaction(transaction);
      
      const state = mockStore.getState();
      expect(state.transactions.items[0].amount).toBe(0.01);
    });

    it('should handle extremely long description', () => {
      const longDescription = 'a'.repeat(10000);
      const transaction = createMockTransaction({
        id: 'long-desc',
        description: longDescription,
      });
      
      mockStore.actions.addTransaction(transaction);
      
      const state = mockStore.getState();
      expect(state.transactions.items[0].description).toBe(longDescription);
    });

    it('should handle empty string description', () => {
      const transaction = createMockTransaction({
        id: 'empty-desc',
        description: '',
      });
      
      mockStore.actions.addTransaction(transaction);
      
      const state = mockStore.getState();
      expect(state.transactions.items[0].description).toBe('');
    });
  });

  describe('Calculation Edge Cases', () => {
    it('should handle empty data arrays in calculations', () => {
      mockStore.actions.calculateDayTotals();
      
      const state = mockStore.getState();
      expect(state.calendar.dayTotals.size).toBe(0);
    });

    it('should handle null data arrays in calculations', () => {
      mockStore.setState((prev: any) => ({
        ...prev,
        transactions: { ...prev.transactions, items: null },
        schedules: { ...prev.schedules, items: null },
      }));
      
      mockStore.actions.calculateDayTotals();
      
      const state = mockStore.getState();
      expect(state.calendar.dayTotals.size).toBe(0);
    });

    it('should skip invalid transactions in calculations', () => {
      const validTransaction = createMockTransaction({ id: 'valid', amount: 1000 });
      const invalidTransactions = [
        null,
        undefined,
        { id: 'no-date', amount: 1000 },
        { id: 'no-amount', date: '2024-02-15' },
        'invalid-string',
        123,
      ];
      
      mockStore.setState((prev: any) => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          items: [validTransaction, ...invalidTransactions],
        },
      }));
      
      mockStore.actions.calculateDayTotals();
      
      const state = mockStore.getState();
      expect(state.calendar.dayTotals.size).toBe(1);
      expect(state.calendar.dayTotals.get(validTransaction.date).totalAmount).toBe(1000);
    });

    it('should handle overflow in total calculations', () => {
      const largeTransactions = Array.from({ length: 10 }, (_, i) =>
        createMockTransaction({
          id: `large-${i}`,
          amount: Number.MAX_SAFE_INTEGER / 100,
          date: '2024-02-15',
        })
      );
      
      mockStore.setState((prev: any) => ({
        ...prev,
        transactions: { ...prev.transactions, items: largeTransactions },
      }));
      
      mockStore.actions.calculateDayTotals();
      
      const state = mockStore.getState();
      const dayTotal = state.calendar.dayTotals.get('2024-02-15');
      expect(dayTotal.totalAmount).toBeGreaterThan(0);
      expect(isFinite(dayTotal.totalAmount)).toBe(true);
    });
  });

  describe('Data Type Coercion Edge Cases', () => {
    it('should handle string numbers in amount field', () => {
      expect(() => {
        mockStore.actions.addTransaction({
          id: 'string-amount',
          amount: '1000', // String instead of number
          description: 'Test',
        });
      }).toThrow('Transaction amount must be a positive number');
    });

    it('should handle boolean values inappropriately used', () => {
      expect(() => {
        mockStore.actions.addTransaction({
          id: 'boolean-amount',
          amount: true, // Boolean instead of number
          description: 'Test',
        });
      }).toThrow('Transaction amount must be a positive number');
    });

    it('should handle array passed as single value', () => {
      expect(() => {
        mockStore.actions.addTransaction([
          { id: 'array-tx', amount: 1000, description: 'Test' }
        ] as any);
      }).toThrow('Invalid transaction data');
    });
  });

  describe('State Corruption Prevention', () => {
    it('should not corrupt state on failed operations', () => {
      const initialTransaction = createMockTransaction({ id: 'initial' });
      mockStore.actions.addTransaction(initialTransaction);
      
      const stateBefore = mockStore.getState();
      
      // Try to add invalid transaction
      try {
        mockStore.actions.addTransaction({ id: 'invalid', amount: -1000 });
      } catch (error) {
        // Expected to fail
      }
      
      const stateAfter = mockStore.getState();
      expect(stateAfter.transactions.items).toEqual(stateBefore.transactions.items);
      expect(stateAfter.transactions.items).toHaveLength(1);
    });

    it('should maintain state integrity after multiple failed operations', () => {
      const validTransaction = createMockTransaction({ id: 'valid' });
      mockStore.actions.addTransaction(validTransaction);
      
      const failedOperations = [
        () => mockStore.actions.addTransaction(null),
        () => mockStore.actions.updateTransaction('non-existent', {}),
        () => mockStore.actions.deleteTransaction('non-existent'),
        () => mockStore.actions.openModal('invalidModal', {}),
      ];
      
      failedOperations.forEach(operation => {
        try {
          operation();
        } catch (error) {
          // Expected to fail
        }
      });
      
      const finalState = mockStore.getState();
      expect(finalState.transactions.items).toHaveLength(1);
      expect(finalState.transactions.items[0].id).toBe('valid');
    });
  });

  describe('Error Recovery', () => {
    it('should track errors appropriately', () => {
      try {
        mockStore.actions.addTransaction(null);
      } catch (error) {
        // Expected
      }
      
      const errors = mockStore.errorTester.getAllErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].context).toBe('setState');
    });

    it('should continue functioning after errors', () => {
      // Cause an error
      try {
        mockStore.actions.addTransaction({ id: 'invalid', amount: -1000 });
      } catch (error) {
        // Expected
      }
      
      // Should still be able to add valid transactions
      const validTransaction = createMockTransaction({ id: 'recovery-test' });
      mockStore.actions.addTransaction(validTransaction);
      
      const state = mockStore.getState();
      expect(state.transactions.items).toHaveLength(1);
      expect(state.transactions.items[0].id).toBe('recovery-test');
    });
  });
});