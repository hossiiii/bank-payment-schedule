/**
 * Enhanced Modal Slice Tests
 * Comprehensive testing for Zustand modal state management
 * Phase 3 production-ready validation
 */

import { renderHook, act } from '@testing-library/react';
import {
  createMockTransaction,
  createMockScheduleItem,
  createMockDayTotalData,
  createMockDataSet,
} from '../../utils/testUtils';
import {
  createTestStore,
  createStoreActionTester,
  createStoreSubscriptionTester,
  createStoreAssertions,
  measureStoreActionPerformance,
  StoreTestWrapper,
} from '../../utils/storeTestUtils';
import { AppStore } from '@/store/types';

describe('Enhanced Modal Slice Tests', () => {
  let store: StoreTestWrapper['store'];
  let actionTester: ReturnType<typeof createStoreActionTester>;
  let subscriptionTester: ReturnType<typeof createStoreSubscriptionTester>;
  let assertions: ReturnType<typeof createStoreAssertions>;

  beforeEach(() => {
    store = createTestStore();
    actionTester = createStoreActionTester(store);
    subscriptionTester = createStoreSubscriptionTester(store);
    assertions = createStoreAssertions();
  });

  afterEach(() => {
    subscriptionTester.cleanup();
    if (store.destroy) {
      store.destroy();
    }
  });

  describe('Initial State Validation', () => {
    it('should have all modals closed initially', () => {
      const state = store.getState();
      
      expect(state.modalStates.transaction).toBe(false);
      expect(state.modalStates.transactionView).toBe(false);
      expect(state.modalStates.scheduleView).toBe(false);
      expect(state.modalStates.scheduleEdit).toBe(false);
      expect(state.modalStates.dayTotal).toBe(false);
    });

    it('should have empty/null selected data initially', () => {
      const state = store.getState();
      
      expect(state.selectedData.date).toBeNull();
      expect(state.selectedData.transaction).toBeNull();
      expect(state.selectedData.transactions).toEqual([]);
      expect(state.selectedData.scheduleItems).toEqual([]);
      expect(state.selectedData.scheduleItem).toBeNull();
      expect(state.selectedData.dayTotalData).toBeNull();
    });

    it('should have proper type structure for modal states', () => {
      const state = store.getState();
      
      expect(typeof state.modalStates).toBe('object');
      expect(typeof state.selectedData).toBe('object');
      expect(typeof state.actions).toBe('object');
      expect(typeof state.actions.openModal).toBe('function');
      expect(typeof state.actions.closeModal).toBe('function');
    });
  });

  describe('Modal Opening Operations', () => {
    it('should open transaction modal with correct data and state updates', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();
      
      act(() => {
        actionTester.captureAction('openModal', {
          modalType: 'transaction',
          data: { date: mockDate, transaction: mockTransaction },
        });
        
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          transaction: mockTransaction,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.date).toEqual(mockDate);
      expect(state.selectedData.transaction).toEqual(mockTransaction);
      
      // Verify subscription was triggered
      const subscriptionCalls = subscriptionTester.getSubscriptionCalls();
      expect(subscriptionCalls.length).toBeGreaterThan(0);
      
      const lastCall = subscriptionTester.getLastCall();
      expect(lastCall.changes).toContain('modalStates.transaction');
      expect(lastCall.changes).toContain('selectedData.date');
    });

    it('should open transaction view modal with transactions list', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-2' })];

      act(() => {
        actionTester.captureAction('openModal', {
          modalType: 'transactionView',
          data: { date: mockDate, transactions: mockTransactions },
        });

        store.getState().actions.openModal('transactionView', {
          date: mockDate,
          transactions: mockTransactions,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transactionView', true);
      expect(state.selectedData.transactions).toHaveLength(2);
      expect(state.selectedData.transactions[0].id).toBe('tx-123');
      expect(state.selectedData.transactions[1].id).toBe('tx-2');
    });

    it('should open schedule view modal with schedule items', () => {
      const mockDate = new Date('2024-02-15');
      const mockScheduleItems = [createMockScheduleItem(), createMockScheduleItem({ id: 'sched-2' })];

      act(() => {
        actionTester.captureAction('openModal', {
          modalType: 'scheduleView',
          data: { date: mockDate, scheduleItems: mockScheduleItems },
        });

        store.getState().actions.openModal('scheduleView', {
          date: mockDate,
          scheduleItems: mockScheduleItems,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'scheduleView', true);
      expect(state.selectedData.scheduleItems).toHaveLength(2);
      expect(state.selectedData.scheduleItems[0].id).toBe('sched-123');
      expect(state.selectedData.scheduleItems[1].id).toBe('sched-2');
    });

    it('should open schedule edit modal with single schedule item', () => {
      const mockScheduleItem = createMockScheduleItem();

      act(() => {
        actionTester.captureAction('openModal', {
          modalType: 'scheduleEdit',
          data: { scheduleItem: mockScheduleItem },
        });

        store.getState().actions.openModal('scheduleEdit', {
          scheduleItem: mockScheduleItem,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'scheduleEdit', true);
      expect(state.selectedData.scheduleItem).toEqual(mockScheduleItem);
      expect(state.selectedData.scheduleItem?.id).toBe(mockScheduleItem.id);
    });

    it('should open day total modal with day total data', () => {
      const mockDate = new Date('2024-02-15');
      const mockDayTotalData = createMockDayTotalData();

      act(() => {
        actionTester.captureAction('openModal', {
          modalType: 'dayTotal',
          data: { date: mockDate, dayTotalData: mockDayTotalData },
        });

        store.getState().actions.openModal('dayTotal', {
          date: mockDate,
          dayTotalData: mockDayTotalData,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'dayTotal', true);
      expect(state.selectedData.dayTotalData).toEqual(mockDayTotalData);
      expect(state.selectedData.dayTotalData?.totalAmount).toBe(20000);
    });

    it('should handle opening multiple modals simultaneously', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();
      const mockScheduleItem = createMockScheduleItem();

      act(() => {
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          transaction: mockTransaction,
        });
        store.getState().actions.openModal('scheduleEdit', {
          scheduleItem: mockScheduleItem,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', true);
      assertions.assertModalState(store, 'scheduleEdit', true);
      expect(state.selectedData.transaction).toEqual(mockTransaction);
      expect(state.selectedData.scheduleItem).toEqual(mockScheduleItem);
    });

    it('should preserve existing data when opening modal without data parameter', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();

      act(() => {
        // First, set some data
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          transaction: mockTransaction,
        });

        // Then open another modal without affecting existing data
        store.getState().actions.openModal('scheduleEdit');
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', true);
      assertions.assertModalState(store, 'scheduleEdit', true);
      expect(state.selectedData.transaction).toEqual(mockTransaction);
      expect(state.selectedData.date).toEqual(mockDate);
    });
  });

  describe('Modal Closing Operations', () => {
    beforeEach(() => {
      // Set up some open modals with data
      act(() => {
        const mockDate = new Date('2024-02-15');
        const mockTransaction = createMockTransaction();
        const mockScheduleItems = [createMockScheduleItem()];
        
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          transaction: mockTransaction,
        });
        store.getState().actions.openModal('transactionView', {
          transactions: [mockTransaction],
        });
        store.getState().actions.openModal('scheduleView', {
          scheduleItems: mockScheduleItems,
        });
      });
    });

    it('should close specific modal and clear its related data only', () => {
      act(() => {
        actionTester.captureAction('closeModal', { modalType: 'transaction' });
        store.getState().actions.closeModal('transaction');
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', false);
      expect(state.selectedData.transaction).toBeNull();
      expect(state.selectedData.date).toBeNull();
      
      // Other modals should remain open with their data
      assertions.assertModalState(store, 'transactionView', true);
      assertions.assertModalState(store, 'scheduleView', true);
      expect(state.selectedData.transactions).toHaveLength(1);
      expect(state.selectedData.scheduleItems).toHaveLength(1);
    });

    it('should close transaction view modal and clear transactions array', () => {
      act(() => {
        store.getState().actions.closeModal('transactionView');
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transactionView', false);
      expect(state.selectedData.transactions).toEqual([]);
      
      // Other data should remain
      expect(state.selectedData.transaction).not.toBeNull();
      expect(state.selectedData.scheduleItems).toHaveLength(1);
    });

    it('should close schedule view modal and clear schedule items array', () => {
      act(() => {
        store.getState().actions.closeModal('scheduleView');
      });

      const state = store.getState();
      assertions.assertModalState(store, 'scheduleView', false);
      expect(state.selectedData.scheduleItems).toEqual([]);
      
      // Other data should remain
      expect(state.selectedData.transaction).not.toBeNull();
      expect(state.selectedData.transactions).toHaveLength(1);
    });

    it('should close all modals and clear all data', () => {
      act(() => {
        actionTester.captureAction('closeAllModals');
        store.getState().actions.closeAllModals();
      });

      const state = store.getState();
      
      // All modals should be closed
      assertions.assertModalState(store, 'transaction', false);
      assertions.assertModalState(store, 'transactionView', false);
      assertions.assertModalState(store, 'scheduleView', false);
      assertions.assertModalState(store, 'scheduleEdit', false);
      assertions.assertModalState(store, 'dayTotal', false);

      // All data should be cleared
      expect(state.selectedData.date).toBeNull();
      expect(state.selectedData.transaction).toBeNull();
      expect(state.selectedData.transactions).toEqual([]);
      expect(state.selectedData.scheduleItems).toEqual([]);
      expect(state.selectedData.scheduleItem).toBeNull();
      expect(state.selectedData.dayTotalData).toBeNull();
    });

    it('should handle closing already closed modal gracefully', () => {
      act(() => {
        // First close the modal
        store.getState().actions.closeModal('transaction');
        
        // Try to close it again
        store.getState().actions.closeModal('transaction');
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', false);
      expect(state.selectedData.transaction).toBeNull();
      
      // Should not affect other modals
      assertions.assertModalState(store, 'transactionView', true);
      assertions.assertModalState(store, 'scheduleView', true);
    });
  });

  describe('Cross-Modal Operations', () => {
    it('should handle transaction view to transaction modal transition', () => {
      const mockTransaction = createMockTransaction();
      
      // First open transaction view modal
      act(() => {
        store.getState().actions.openModal('transactionView', {
          date: new Date(),
          transactions: [mockTransaction],
        });
      });

      // Then transition to transaction modal using cross-modal handler
      act(() => {
        actionTester.captureAction('handleTransactionViewTransactionClick', { transaction: mockTransaction });
        store.getState().actions.handleTransactionViewTransactionClick(mockTransaction);
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transactionView', false);
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.transaction?.id).toBe(mockTransaction.id);
      expect(state.selectedData.date).toEqual(new Date(mockTransaction.date));
      expect(state.selectedData.transactions).toEqual([]); // Should be cleared
    });

    it('should handle schedule view to schedule edit modal transition', () => {
      const mockScheduleItem = createMockScheduleItem();
      
      act(() => {
        store.getState().actions.openModal('scheduleView', {
          date: new Date(),
          scheduleItems: [mockScheduleItem],
        });
      });

      // Simulate clicking on schedule item to edit it
      act(() => {
        store.getState().actions.closeModal('scheduleView');
        store.getState().actions.openModal('scheduleEdit', {
          scheduleItem: mockScheduleItem,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'scheduleView', false);
      assertions.assertModalState(store, 'scheduleEdit', true);
      expect(state.selectedData.scheduleItem?.id).toBe(mockScheduleItem.id);
      expect(state.selectedData.scheduleItems).toEqual([]); // Should be cleared
    });

    it('should handle complex cross-modal workflow', () => {
      const mockDataSet = createMockDataSet();
      const mockDayTotalData = createMockDayTotalData({
        transactions: mockDataSet.transactions,
        scheduleItems: mockDataSet.scheduleItems,
      });
      
      // Start with day total modal
      act(() => {
        store.getState().actions.openModal('dayTotal', {
          date: new Date('2024-02-15'),
          dayTotalData: mockDayTotalData,
        });
      });

      // Navigate to transaction view
      act(() => {
        store.getState().actions.closeModal('dayTotal');
        store.getState().actions.openModal('transactionView', {
          date: new Date('2024-02-15'),
          transactions: mockDataSet.transactions,
        });
      });

      // Navigate to specific transaction
      act(() => {
        store.getState().actions.handleTransactionViewTransactionClick(mockDataSet.transactions[0]);
      });

      const state = store.getState();
      assertions.assertModalState(store, 'dayTotal', false);
      assertions.assertModalState(store, 'transactionView', false);
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.transaction?.id).toBe(mockDataSet.transactions[0].id);
      expect(state.selectedData.dayTotalData).toBeNull();
      expect(state.selectedData.transactions).toEqual([]);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle opening modal with null/undefined data gracefully', () => {
      act(() => {
        store.getState().actions.openModal('transaction', {
          date: null,
          transaction: null,
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.date).toBeNull();
      expect(state.selectedData.transaction).toBeNull();
    });

    it('should handle opening modal with partial data', () => {
      const mockDate = new Date('2024-02-15');
      
      act(() => {
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          // transaction is intentionally omitted
        });
      });

      const state = store.getState();
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.date).toEqual(mockDate);
      expect(state.selectedData.transaction).toBeNull(); // Should remain null
    });

    it('should handle invalid modal type gracefully', () => {
      act(() => {
        // This should not cause errors even if modal type is invalid
        try {
          // @ts-ignore - intentionally testing invalid type
          store.getState().actions.openModal('invalidModal', {});
        } catch (error) {
          // Should not throw
        }
      });

      // Store should remain stable
      const state = store.getState();
      expect(typeof state.modalStates).toBe('object');
    });

    it('should handle rapid consecutive operations without corruption', () => {
      const mockTransaction = createMockTransaction();
      const mockScheduleItem = createMockScheduleItem();
      
      act(() => {
        // Rapid fire operations
        for (let i = 0; i < 10; i++) {
          store.getState().actions.openModal('transaction', { transaction: mockTransaction });
          store.getState().actions.closeModal('transaction');
          store.getState().actions.openModal('scheduleEdit', { scheduleItem: mockScheduleItem });
          store.getState().actions.closeModal('scheduleEdit');
        }
      });

      const state = store.getState();
      // Should end in consistent state
      assertions.assertModalState(store, 'transaction', false);
      assertions.assertModalState(store, 'scheduleEdit', false);
      expect(state.selectedData.transaction).toBeNull();
      expect(state.selectedData.scheduleItem).toBeNull();
    });

    it('should handle cross-modal operations with missing data', () => {
      const mockTransaction = createMockTransaction();
      
      // Try to handle cross-modal operation without setting up initial state
      act(() => {
        store.getState().actions.handleTransactionViewTransactionClick(mockTransaction);
      });

      const state = store.getState();
      // Should still work and open transaction modal
      assertions.assertModalState(store, 'transaction', true);
      expect(state.selectedData.transaction?.id).toBe(mockTransaction.id);
    });

    it('should handle async cross-modal operations with errors gracefully', async () => {
      // Mock console.error to avoid noise in test output
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock the fetchTransactionById to fail
      const originalFetch = store.getState().actions.fetchTransactionById;
      store.setState({
        actions: {
          ...store.getState().actions,
          fetchTransactionById: jest.fn().mockRejectedValue(new Error('Network error')),
        },
      });

      await act(async () => {
        await store.getState().actions.handleScheduleTransactionClick('invalid-id');
      });

      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to fetch transaction for cross-modal operation:',
        expect.any(Error)
      );
      
      // Restore
      consoleSpy.mockRestore();
      store.setState({
        actions: {
          ...store.getState().actions,
          fetchTransactionById: originalFetch,
        },
      });
    });
  });

  describe('Performance & Stress Tests', () => {
    it('should handle rapid modal open/close operations efficiently', async () => {
      const result = await measureStoreActionPerformance(
        () => {
          act(() => {
            store.getState().actions.openModal('transaction', {
              date: new Date(),
              transaction: createMockTransaction(),
            });
            store.getState().actions.closeModal('transaction');
          });
        },
        100,
        { warmupIterations: 10 }
      );

      expect(result.averageTime).toBeLessThan(5); // Should be very fast
      expect(result.totalTime).toBeLessThan(500);
    });

    it('should handle multiple concurrent modal operations without conflicts', () => {
      const mockData = {
        date: new Date('2024-02-15'),
        transaction: createMockTransaction(),
        transactions: [createMockTransaction()],
        scheduleItems: [createMockScheduleItem()],
        dayTotalData: createMockDayTotalData(),
      };

      act(() => {
        // Open multiple modals simultaneously
        store.getState().actions.openModal('transaction', mockData);
        store.getState().actions.openModal('transactionView', mockData);
        store.getState().actions.openModal('scheduleView', mockData);
        store.getState().actions.openModal('dayTotal', mockData);
      });

      const state = store.getState();
      // All should be open
      assertions.assertModalState(store, 'transaction', true);
      assertions.assertModalState(store, 'transactionView', true);
      assertions.assertModalState(store, 'scheduleView', true);
      assertions.assertModalState(store, 'dayTotal', true);

      act(() => {
        // Close all at once
        store.getState().actions.closeAllModals();
      });

      // All should be closed
      assertions.assertModalState(store, 'transaction', false);
      assertions.assertModalState(store, 'transactionView', false);
      assertions.assertModalState(store, 'scheduleView', false);
      assertions.assertModalState(store, 'dayTotal', false);
    });

    it('should handle large datasets in modals efficiently', () => {
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => 
        createMockTransaction({ id: `tx-${i}`, amount: i * 100 })
      );
      
      const largeScheduleList = Array.from({ length: 500 }, (_, i) => 
        createMockScheduleItem({ id: `sched-${i}`, amount: i * 50 })
      );

      const startTime = performance.now();
      
      act(() => {
        store.getState().actions.openModal('transactionView', {
          transactions: largeTransactionList,
        });
        store.getState().actions.openModal('scheduleView', {
          scheduleItems: largeScheduleList,
        });
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      const state = store.getState();
      expect(state.selectedData.transactions).toHaveLength(1000);
      expect(state.selectedData.scheduleItems).toHaveLength(500);
      expect(duration).toBeLessThan(50); // Should handle large datasets quickly
    });

    it('should maintain performance under subscription load', () => {
      const subscriptions: Array<() => void> = [];
      
      // Create many subscriptions
      for (let i = 0; i < 100; i++) {
        const unsubscribe = store.subscribe(() => {
          // Simulate subscription work
          Math.random();
        });
        subscriptions.push(unsubscribe);
      }

      const startTime = performance.now();
      
      act(() => {
        // This should trigger all subscriptions
        store.getState().actions.openModal('transaction', {
          transaction: createMockTransaction(),
        });
      });
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Cleanup subscriptions
      subscriptions.forEach(unsubscribe => unsubscribe());

      expect(duration).toBeLessThan(20); // Should remain fast even with many subscriptions
    });
  });

  describe('Type Safety & Data Integrity', () => {
    it('should maintain correct data types for modal states', () => {
      const mockDate = new Date('2024-02-15');
      const mockTransaction = createMockTransaction();

      act(() => {
        store.getState().actions.openModal('transaction', {
          date: mockDate,
          transaction: mockTransaction,
        });
      });

      const state = store.getState();
      
      // Type checks
      expect(typeof state.modalStates.transaction).toBe('boolean');
      expect(state.selectedData.date).toBeInstanceOf(Date);
      expect(typeof state.selectedData.transaction?.id).toBe('string');
      expect(typeof state.selectedData.transaction?.amount).toBe('number');
      expect(Array.isArray(state.selectedData.transactions)).toBe(true);
      expect(Array.isArray(state.selectedData.scheduleItems)).toBe(true);
    });

    it('should handle undefined and null values correctly', () => {
      act(() => {
        store.getState().actions.openModal('transaction', {
          date: null,
          transaction: undefined,
        });
      });

      const state = store.getState();
      expect(state.selectedData.date).toBeNull();
      expect(state.selectedData.transaction).toBeUndefined();
    });

    it('should preserve data immutability', () => {
      const mockTransaction = createMockTransaction();
      const originalTransaction = JSON.parse(JSON.stringify(mockTransaction));
      
      act(() => {
        store.getState().actions.openModal('transaction', {
          transaction: mockTransaction,
        });
      });

      const state = store.getState();
      
      // Modify the original object
      mockTransaction.amount = 99999;
      
      // Store should maintain its own copy
      expect(state.selectedData.transaction?.amount).toBe(originalTransaction.amount);
      expect(state.selectedData.transaction?.amount).not.toBe(99999);
    });

    it('should handle array mutations correctly', () => {
      const mockTransactions = [createMockTransaction(), createMockTransaction({ id: 'tx-2' })];
      const originalLength = mockTransactions.length;
      
      act(() => {
        store.getState().actions.openModal('transactionView', {
          transactions: mockTransactions,
        });
      });

      // Mutate original array
      mockTransactions.push(createMockTransaction({ id: 'tx-3' }));
      
      const state = store.getState();
      // Store should maintain original array length
      expect(state.selectedData.transactions).toHaveLength(originalLength);
      expect(state.selectedData.transactions).not.toHaveLength(mockTransactions.length);
    });
  });

  describe('State Consistency & Validation', () => {
    it('should maintain state consistency across multiple operations', () => {
      const mockData = createMockDataSet();
      
      act(() => {
        // Complex sequence of operations
        store.getState().actions.openModal('transactionView', {
          transactions: mockData.transactions,
        });
        store.getState().actions.openModal('scheduleView', {
          scheduleItems: mockData.scheduleItems,
        });
        store.getState().actions.closeModal('transactionView');
        store.getState().actions.openModal('transaction', {
          transaction: mockData.transactions[0],
        });
      });

      const state = store.getState();
      
      // Verify final state is consistent
      assertions.assertModalState(store, 'transactionView', false);
      assertions.assertModalState(store, 'scheduleView', true);
      assertions.assertModalState(store, 'transaction', true);
      
      expect(state.selectedData.transactions).toEqual([]); // Cleared when modal closed
      expect(state.selectedData.scheduleItems).toHaveLength(2); // Still present
      expect(state.selectedData.transaction?.id).toBe(mockData.transactions[0].id);
    });

    it('should validate modal state transitions', () => {
      const stateHistory: Array<any> = [];
      
      // Subscribe to state changes
      const unsubscribe = store.subscribe((state) => {
        stateHistory.push({
          modalStates: { ...state.modalStates },
          selectedDataKeys: Object.keys(state.selectedData).filter(
            key => state.selectedData[key as keyof typeof state.selectedData] !== null &&
                  (Array.isArray(state.selectedData[key as keyof typeof state.selectedData]) ? 
                   (state.selectedData[key as keyof typeof state.selectedData] as any[]).length > 0 : true)
          ),
        });
      });

      act(() => {
        store.getState().actions.openModal('transaction', {
          date: new Date(),
          transaction: createMockTransaction(),
        });
        store.getState().actions.closeModal('transaction');
        store.getState().actions.openModal('scheduleView', {
          scheduleItems: [createMockScheduleItem()],
        });
      });

      unsubscribe();

      // Verify state transitions make sense
      expect(stateHistory.length).toBeGreaterThan(0);
      
      // Last state should have schedule modal open and schedule data
      const lastState = stateHistory[stateHistory.length - 1];
      expect(lastState.modalStates.scheduleView).toBe(true);
      expect(lastState.selectedDataKeys).toContain('scheduleItems');
      expect(lastState.selectedDataKeys).not.toContain('transaction');
    });
  });
});